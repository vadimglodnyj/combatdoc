import { execSync } from 'child_process';
import type { INestApplication, LoggerService } from '@nestjs/common';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function parsePort(value: string | undefined, fallback = 3000): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535 ? parsed : fallback;
}

/** Parse `netstat -ano` LISTENING rows for a TCP port (Windows). Exported for tests. */
export function pidsFromNetstat(output: string, port: number): string[] {
  const pids = new Set<string>();
  for (const line of output.split(/\r?\n/)) {
    if (!/LISTENING/i.test(line)) continue;
    const match = line.match(/:(\d+)\s+\S+\s+LISTENING\s+(\d+)/i);
    if (match && Number(match[1]) === port && match[2] !== '0') {
      pids.add(match[2]);
    }
  }
  return [...pids];
}

export function pidsListeningOn(port: number): string[] {
  try {
    if (process.platform === 'win32') {
      const output = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
      return pidsFromNetstat(output, port).filter((pid) => pid !== String(process.pid));
    }
    return pidsFromUnix(port);
  } catch {
    return [];
  }
}

function pidsFromUnix(port: number): string[] {
  const pids = new Set<string>();
  try {
    const output = execSync(`lsof -iTCP:${port} -sTCP:LISTEN -n -P -t`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    for (const pid of output.split(/\s+/)) {
      if (/^\d+$/.test(pid) && pid !== String(process.pid)) pids.add(pid);
    }
  } catch {
    try {
      const output = execSync(`ss -lptn "sport = :${port}"`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      for (const match of output.matchAll(/pid=(\d+)/g)) {
        if (match[1] !== String(process.pid)) pids.add(match[1]);
      }
    } catch {
      // no lsof/ss available
    }
  }
  return [...pids];
}

export function killListeningPids(port: number, logger?: LoggerService): string[] {
  const pids = pidsListeningOn(port);
  const killed: string[] = [];
  for (const pid of pids) {
    if (pid === String(process.pid) || pid === '0' || pid === '4') continue;
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
      } else {
        process.kill(Number(pid), 'SIGKILL');
      }
      killed.push(pid);
    } catch {
      // process already gone
    }
  }
  if (killed.length) {
    logger?.warn?.(`Звільнено порт ${port} (PID ${killed.join(', ')})`);
  }
  return killed;
}

function busyPortHelp(port: number): string {
  const win = `Windows: netstat -ano | findstr :${port}   потім   taskkill /PID <PID> /F`;
  const unix = `Linux/macOS: lsof -ti :${port} | xargs kill -9`;
  return `Порт ${port} зайнятий (EADDRINUSE). Зупиніть інший процес або задайте PORT у apps/api/.env.\n${win}\n${unix}`;
}

export async function bindHttpPort(
  app: INestApplication,
  port: number,
  options?: { logger?: LoggerService; killOnBusy?: boolean; retries?: number },
): Promise<void> {
  const logger = options?.logger;
  const killOnBusy = options?.killOnBusy ?? process.env.NODE_ENV !== 'production';
  const retries = options?.retries ?? 8;
  let killedOnce = false;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await app.listen(port, '0.0.0.0');
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code !== 'EADDRINUSE') throw err;

      if (killOnBusy && !killedOnce) {
        killListeningPids(port, logger);
        killedOnce = true;
        await sleep(300);
        continue;
      }

      if (attempt === retries) {
        logger?.error?.(busyPortHelp(port));
        throw err;
      }

      logger?.warn?.(
        `Порт ${port} зайнятий, повтор ${attempt}/${retries} через 400мс (watch restart)...`,
      );
      await sleep(400);
    }
  }
}

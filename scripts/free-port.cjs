#!/usr/bin/env node
/**
 * Frees a TCP listen port (Windows + Unix). Used before API watch mode.
 * Usage: node scripts/free-port.cjs [port]
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function portFromEnvFile(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    const match = text.match(/^PORT=(\d+)\s*$/m);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

function resolvePort() {
  const arg = Number(process.argv[2]);
  if (Number.isInteger(arg) && arg > 0) return arg;
  const envPort = Number(process.env.PORT);
  if (Number.isInteger(envPort) && envPort > 0) return envPort;
  const fromApiEnv = portFromEnvFile(path.join(__dirname, '../apps/api/.env'));
  if (fromApiEnv) return fromApiEnv;
  return 3000;
}

function pidsFromNetstat(output, port) {
  const pids = new Set();
  for (const line of output.split(/\r?\n/)) {
    if (!/LISTENING/i.test(line)) continue;
    const match = line.match(/:(\d+)\s+\S+\s+LISTENING\s+(\d+)/i);
    if (match && Number(match[1]) === port && match[2] !== '0') pids.add(match[2]);
  }
  return [...pids];
}

function pidsListeningOn(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
      return pidsFromNetstat(output, port).filter((pid) => pid !== String(process.pid));
    }
    try {
      const output = execSync(`lsof -iTCP:${port} -sTCP:LISTEN -n -P -t`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      return output.split(/\s+/).filter((pid) => /^\d+$/.test(pid) && pid !== String(process.pid));
    } catch {
      const output = execSync(`ss -lptn "sport = :${port}"`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      const pids = new Set();
      for (const match of output.matchAll(/pid=(\d+)/g)) {
        if (match[1] !== String(process.pid)) pids.add(match[1]);
      }
      return [...pids];
    }
  } catch {
    return [];
  }
}

const port = resolvePort();
const pids = pidsListeningOn(port);
for (const pid of pids) {
  if (pid === '0' || pid === '4') continue;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(Number(pid), 'SIGKILL');
    }
    console.log(`Freed port ${port} (killed PID ${pid})`);
  } catch {
    // already gone
  }
}
if (!pids.length) {
  console.log(`Port ${port} is free`);
}

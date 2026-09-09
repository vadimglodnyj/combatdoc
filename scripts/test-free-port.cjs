const assert = require('assert');
const http = require('http');
const { spawn, spawnSync } = require('child_process');
const path = require('path');

function pidsFromNetstat(output, port) {
  const pids = new Set();
  for (const line of output.split(/\r?\n/)) {
    if (!/LISTENING/i.test(line)) continue;
    const match = line.match(/:(\d+)\s+\S+\s+LISTENING\s+(\d+)/i);
    if (match && Number(match[1]) === port && match[2] !== '0') pids.add(match[2]);
  }
  return [...pids];
}

const sample = `
  TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       4242
  TCP    [::]:3000              [::]:0                 LISTENING       4242
  TCP    0.0.0.0:30000          0.0.0.0:0              LISTENING       99
  TCP    127.0.0.1:3000         127.0.0.1:51234        ESTABLISHED     7
`.trim();

assert.deepStrictEqual(pidsFromNetstat(sample, 3000).sort(), ['4242']);
assert.deepStrictEqual(pidsFromNetstat(sample, 30000), ['99']);
assert.deepStrictEqual(pidsFromNetstat(sample, 80), []);

const script = path.join(__dirname, 'free-port.cjs');

function waitForPort(port, timeoutMs = 4000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.get({ host: '127.0.0.1', port, timeout: 300 }, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - started > timeoutMs) reject(new Error(`port ${port} did not open`));
        else setTimeout(tryOnce, 50);
      });
    };
    tryOnce();
  });
}

function spawnHolder(port) {
  const child = spawn(
    process.execPath,
    ['-e', `require('http').createServer((q,s)=>s.end('ok')).listen(${port},'127.0.0.1')`],
    { stdio: 'ignore' },
  );
  child.unref();
  return child;
}

async function main() {
  const port = 34567;
  const holder = spawnHolder(port);
  await waitForPort(port);

  const listed = spawnSync(process.execPath, [script, String(port)], { encoding: 'utf8' });
  assert.equal(listed.status, 0, listed.stderr || listed.stdout);
  assert.match(listed.stdout, /Freed port 34567|killed PID/i);

  await new Promise((r) => setTimeout(r, 250));

  const rebound = await new Promise((resolve, reject) => {
    const server = http.createServer();
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
  rebound.close();

  try {
    holder.kill('SIGKILL');
  } catch {
    // already killed by free-port
  }

  const free = spawnSync(process.execPath, [script, String(port)], { encoding: 'utf8' });
  assert.equal(free.status, 0, free.stderr || free.stdout);
  assert.match(free.stdout, /Port 34567 is free/);

  console.log('free-port tests passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

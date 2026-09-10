const assert = require('assert');
const http = require('http');
const { spawn } = require('child_process');
const { parsePort, pidsFromNetstat, bindHttpPort } = require('../apps/api/dist/common/bind-port');

assert.equal(parsePort(undefined), 3000);
assert.equal(parsePort('4201'), 4201);
assert.equal(parsePort('nope'), 3000);
assert.equal(parsePort('0'), 3000);

const sample = `
  TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       4242
  TCP    [::]:3000              [::]:0                 LISTENING       4242
  TCP    0.0.0.0:30000          0.0.0.0:0              LISTENING       99
`.trim();
assert.deepStrictEqual(pidsFromNetstat(sample, 3000), ['4242']);

async function testRetryThenBind() {
  let calls = 0;
  const err = Object.assign(new Error('listen EADDRINUSE'), { code: 'EADDRINUSE' });
  const app = {
    async listen() {
      calls += 1;
      if (calls === 1) throw err;
    },
  };
  const logs = [];
  const logger = { warn: (m) => logs.push(m), error: (m) => logs.push(m) };
  await bindHttpPort(app, 3000, { logger, killOnBusy: false, retries: 3 });
  assert.equal(calls, 2);
  assert.ok(logs.some((m) => /Порт 3000 зайнятий/.test(m)));
}

async function testGivesUp() {
  const err = Object.assign(new Error('listen EADDRINUSE'), { code: 'EADDRINUSE' });
  const app = {
    async listen() {
      throw err;
    },
  };
  let help;
  const logger = { warn: () => {}, error: (m) => { help = m; } };
  await assert.rejects(
    () => bindHttpPort(app, 3000, { logger, killOnBusy: false, retries: 2 }),
    (e) => e.code === 'EADDRINUSE',
  );
  assert.match(help, /EADDRINUSE/);
  assert.match(help, /taskkill/);
}

function spawnHolder(port) {
  const child = spawn(
    process.execPath,
    ['-e', `require('http').createServer((q,s)=>s.end('ok')).listen(${port},'0.0.0.0')`],
    { stdio: 'ignore' },
  );
  child.unref();
  return child;
}

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

async function testKillsOccupantAndBinds() {
  const port = 34568;
  const holder = spawnHolder(port);
  await waitForPort(port);

  let boundServer;
  const app = {
    listen(p, host) {
      return new Promise((resolve, reject) => {
        const server = http.createServer();
        server.once('error', reject);
        server.listen(p, host, () => {
          boundServer = server;
          resolve(server);
        });
      });
    },
  };

  const logs = [];
  await bindHttpPort(app, port, {
    logger: { warn: (m) => logs.push(String(m)), error: (m) => logs.push(String(m)) },
    killOnBusy: true,
    retries: 4,
  });
  assert.ok(boundServer);
  assert.ok(logs.some((m) => /Звільнено порт 34568/.test(m)));
  boundServer.close();
  try {
    holder.kill('SIGKILL');
  } catch {
    // already killed
  }
}

async function main() {
  await testRetryThenBind();
  await testGivesUp();
  await testKillsOccupantAndBinds();
  console.log('bind-port unit tests passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

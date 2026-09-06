import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const templateRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const PORT = 5196;

function portFree() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', error => error.code === 'EADDRINUSE' ? resolve(false) : reject(error));
    probe.listen(PORT, '127.0.0.1', () => probe.close(() => resolve(true)));
  });
}

async function assertPortFree(label) {
  if (!await portFree()) throw new Error(`Port ${PORT} is in use (${label}); not killing other processes.`);
}

async function waitPortFree(timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await portFree()) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  await assertPortFree('after previous server');
}

function run(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const entry = command === 'playwright' ? 'node_modules/@playwright/test/cli.js' : 'node_modules/vite/bin/vite.js';
    const child = spawn(process.execPath, [entry, ...args], {
      cwd: templateRoot,
      stdio: 'inherit',
      env: { ...process.env, ...env },
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited ${code}`));
    });
  });
}

await assertPortFree('before e2e');
await run('playwright', ['test']);
await waitPortFree();
await run('vite', ['build'], { BASE_PATH: '/example/viewer/' });
await assertPortFree('before nested e2e');
await run('playwright', ['test', 'tests/e2e/basepath.spec.js'], { E2E_NESTED: '1' });
await waitPortFree();

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');

// The integration suite exercises the real production build, the same way the
// Express version exercised its app object: build once, serve, fetch.
export function ensureBuild() {
  const marker = path.join(root, '.next', 'BUILD_ID');
  if (fs.existsSync(marker)) return;
  const res = spawnSync(process.execPath, [nextBin, 'build'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
  });
  if (res.status !== 0) throw new Error('next build failed');
}

export async function startServer(port = 3211) {
  ensureBuild();
  const child = spawn(process.execPath, [nextBin, 'start', '-p', String(port)], {
    cwd: root,
    stdio: 'ignore',
    env: { ...process.env, NODE_ENV: 'production' },
  });

  const base = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 60_000;
  for (;;) {
    try {
      const res = await fetch(`${base}/api/health`);
      if (res.ok) break;
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) {
      child.kill();
      throw new Error(`next start did not become ready on ${base}`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return { base, stop: () => child.kill() };
}

export const get = (base, p, init) => fetch(`${base}${p}`, init);
export const json = async (base, p, init) => {
  const res = await fetch(`${base}${p}`, init);
  const body = await res.json().catch(() => null);
  return { status: res.status, body, headers: res.headers };
};
export const post = (base, p, payload) => json(base, p, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: typeof payload === 'string' ? payload : JSON.stringify(payload),
});
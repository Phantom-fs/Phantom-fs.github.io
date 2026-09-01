import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();
const metrics = spawnSync(
  process.execPath,
  [resolve(root, 'scripts/metrics/build.mjs')],
  {
    cwd: root,
    env: { ...process.env, METRICS_MODE: process.env.METRICS_MODE ?? 'dev' },
    stdio: 'inherit'
  }
);

if (metrics.status !== 0) {
  process.exit(metrics.status ?? 1);
}

const astro = spawn(
  process.execPath,
  [
    resolve(root, 'node_modules/astro/bin/astro.mjs'),
    'dev',
    ...process.argv.slice(2)
  ],
  { cwd: root, env: process.env, stdio: 'inherit' }
);

astro.once('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});

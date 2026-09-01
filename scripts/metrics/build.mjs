import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const managedPython = resolve('.tools/python-test-venv/Scripts/python.exe');
if (
  process.platform === 'win32' &&
  !process.env.METRICS_PYTHON &&
  !existsSync(managedPython)
) {
  const provision = spawnSync(
    'powershell',
    ['-ExecutionPolicy', 'Bypass', '-File', 'scripts/test-python.ps1'],
    { stdio: 'inherit' }
  );
  if (provision.status !== 0) process.exit(provision.status ?? 1);
}
const python =
  process.env.METRICS_PYTHON ??
  (process.platform === 'win32' && existsSync(managedPython)
    ? managedPython
    : 'python3');
const mode = process.env.METRICS_MODE ?? 'scholar';
const result = spawnSync(
  python,
  [
    '-m',
    'scripts.metrics.run',
    '--mode',
    mode,
    '--identifiers',
    'src/data/publication-identifiers.json',
    '--output',
    'src/data/generated/citations.json',
    '--generated-at',
    new Date().toISOString()
  ],
  { stdio: 'inherit' }
);
if (result.status !== 0) process.exit(result.status ?? 1);

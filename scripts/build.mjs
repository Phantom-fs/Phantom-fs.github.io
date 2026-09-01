import { access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();

const steps = [
  {
    name: 'asset generation',
    args: [resolve(root, 'scripts/assets/generate-images.mjs')]
  },
  {
    name: 'content validation',
    args: [
      resolve(root, 'node_modules/tsx/dist/cli.mjs'),
      resolve(root, 'scripts/validate-content.ts')
    ]
  },
  {
    name: 'metrics build',
    args: [resolve(root, 'scripts/metrics/build.mjs')]
  },
  {
    name: 'Astro production build',
    args: [resolve(root, 'node_modules/astro/bin/astro.mjs'), 'build']
  }
];

const runStep = async ({ name, args }) => {
  await Promise.all(
    args
      .filter((argument) => argument.startsWith(root))
      .map((argument) => access(argument))
  );

  await new Promise((resolveStep, rejectStep) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      env: process.env,
      stdio: 'inherit'
    });

    child.once('error', rejectStep);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolveStep();
        return;
      }
      rejectStep(
        new Error(
          `Production build ${name} failed with ${
            signal ? `signal ${signal}` : `exit code ${code}`
          }.`
        )
      );
    });
  });
};

for (const step of steps) {
  await runStep(step);
}

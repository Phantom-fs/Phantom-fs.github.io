import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('reproducible browser verification configuration', () => {
  it('runs repeatable Lighthouse measurements and enforces web-vital budgets', async () => {
    const config = await readFile(resolve('lighthouserc.cjs'), 'utf8');

    expect(config).toContain('numberOfRuns: 3');
    expect(config).toContain("'largest-contentful-paint'");
    expect(config).toContain('maxNumericValue: 2500');
    expect(config).toContain("'cumulative-layout-shift'");
    expect(config).toContain('maxNumericValue: 0.1');
    expect(config).toContain("'total-blocking-time'");
    expect(config).toContain('maxNumericValue: 200');
  });

  it('uses the project-owned production server rather than ambient runners', async () => {
    const config = await readFile(resolve('playwright.config.ts'), 'utf8');

    expect(config).toContain('process.execPath');
    expect(config).toContain('quoteCommandArgument');
    expect(config).toContain('./scripts/e2e/production-server.mjs');
    expect(config).toContain("url: 'http://127.0.0.1:4321/404.html'");
    expect(config).not.toContain('pnpm build');
    expect(config).not.toContain('python -m http.server');
    expect(config).not.toContain('astro.mjs dev');
  });

  it('installs only the selected browser with its CI libraries and runs that project directly', async () => {
    const workflow = await readFile(
      resolve('.github', 'workflows', 'ci.yml'),
      'utf8'
    );

    expect(workflow).toContain(
      'pnpm exec playwright install --with-deps ${{ matrix.browser }}'
    );
    expect(workflow).toContain(
      'pnpm exec playwright test --project=${{ matrix.browser }}'
    );
    expect(workflow).not.toContain('id: setup-pnpm');
    expect(workflow).not.toContain('npm_execpath:');
    expect(workflow).not.toContain('pnpm test:e2e -- --project=');
  });

  it('builds and uploads exactly one metrics-aware Pages artifact', async () => {
    const workflow = await readFile(
      resolve('.github', 'workflows', 'deploy.yml'),
      'utf8'
    );
    const pythonSetup = workflow.indexOf(
      'python -m pip install --require-hashes -r requirements.lock'
    );
    const astroAction = workflow.indexOf('uses: withastro/action@v6');

    expect(pythonSetup).toBeGreaterThan(-1);
    expect(astroAction).toBeGreaterThan(pythonSetup);
    expect(workflow).toMatch(
      /uses: withastro\/action@v6[\s\S]*?env:\s+METRICS_MODE:/
    );
    expect(workflow).not.toContain('actions/upload-pages-artifact@');
    expect(workflow).not.toMatch(/^\s+- run: pnpm build$/m);
  });

  it('lets a manual deployment exercise the scheduled metrics path', async () => {
    const workflow = await readFile(
      resolve('.github', 'workflows', 'deploy.yml'),
      'utf8'
    );

    expect(workflow).toMatch(
      /workflow_dispatch:[\s\S]*?metrics_mode:[\s\S]*?options:\s+- push\s+- schedule/
    );
    expect(workflow).toContain("inputs.metrics_mode == 'schedule'");
  });

  it('runs push workflows on the GitHub default branch', async () => {
    const [ciWorkflow, deployWorkflow] = await Promise.all([
      readFile(resolve('.github', 'workflows', 'ci.yml'), 'utf8'),
      readFile(resolve('.github', 'workflows', 'deploy.yml'), 'utf8')
    ]);

    expect(ciWorkflow).toContain('branches: [main]');
    expect(deployWorkflow).toContain('branches: [main]');
  });

  it('uses a production-artifact link gate that cannot pass on zero links', async () => {
    const [manifest, script] = await Promise.all([
      readFile(resolve('package.json'), 'utf8'),
      readFile(resolve('scripts', 'check-links.mjs'), 'utf8')
    ]);

    expect(JSON.parse(manifest).scripts['check:links']).toBe(
      'node scripts/check-links.mjs'
    );
    expect(script).toContain("path: resolve('dist')");
    expect(script).toContain('recurse: true');
    expect(script).toContain('No first-party links were checked');
  });

  it('commits and verifies responsive visual baselines in CI', async () => {
    const [manifest, workflow, visualConfig] = await Promise.all([
      readFile(resolve('package.json'), 'utf8'),
      readFile(resolve('.github', 'workflows', 'ci.yml'), 'utf8'),
      readFile(resolve('playwright.visual.config.ts'), 'utf8')
    ]);

    expect(JSON.parse(manifest).scripts['test:visual']).toContain(
      'playwright.visual.config.ts'
    );
    expect(workflow).toContain('pnpm test:visual');
    expect(visualConfig).toContain("testDir: './tests/visual'");
    expect(visualConfig).toContain(
      "snapshotPathTemplate: '{testDir}/baselines/{arg}{ext}'"
    );
    expect(visualConfig).toContain('maxDiffPixelRatio: 0.05');
  });
});

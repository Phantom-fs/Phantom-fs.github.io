import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('production browser-server harness', () => {
  it('uses one project-owned production build definition and no ambient command lookup', async () => {
    const [build, server, packageJson] = await Promise.all([
      readFile(resolve('scripts', 'build.mjs'), 'utf8'),
      readFile(resolve('scripts', 'e2e', 'production-server.mjs'), 'utf8'),
      readFile(resolve('package.json'), 'utf8')
    ]);

    expect(build).toContain('process.execPath');
    expect(build).toContain('scripts/assets/generate-images.mjs');
    expect(build).toContain('node_modules/tsx/dist/cli.mjs');
    expect(build).toContain('scripts/metrics/build.mjs');
    expect(build).toContain('node_modules/astro/bin/astro.mjs');
    expect(build).not.toContain('npm_execpath');
    expect(build).not.toMatch(/spawn\(['\"]pnpm/);
    expect(build).not.toContain('python -m http.server');
    expect(server).toContain("'scripts', 'build.mjs'");
    expect(server).toMatch(/spawn\(\s*process\.execPath/);
    expect(server).not.toContain('npm_execpath');
    expect(server).not.toMatch(/spawn\(['\"]pnpm/);
    expect(server).not.toContain('python -m http.server');
    expect(JSON.parse(packageJson).scripts.build).toBe(
      'node scripts/build.mjs'
    );
  });

  it('serves exact static files with MIME, 404, and graceful termination', async () => {
    const server = await readFile(
      resolve('scripts', 'e2e', 'production-server.mjs'),
      'utf8'
    );

    expect(server).toContain("'Content-Type'");
    expect(server).toContain("sendPlainResponse(response, 404, 'Not found')");
    expect(server).toContain("decodedPathname === '/'");
    expect(server).toContain("'/index.html'");
    expect(server).toContain('`${decodedPathname}index.html`');
    expect(server).toContain("process.on('SIGTERM'");
    expect(server).toContain("process.on('SIGINT'");
  });
});

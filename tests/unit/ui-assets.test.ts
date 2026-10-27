import { access, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const publicPath = (...parts: string[]) => resolve('public', ...parts);

describe('Editorial Research Atlas assets', () => {
  it('ships the selected identity in the declared icon, app and sharing sizes', async () => {
    for (const size of [16, 32, 48, 64, 96, 128, 180, 192, 256, 512, 1024]) {
      expect(
        await sharp(publicPath(`favicon-${size}.png`)).metadata()
      ).toMatchObject({ width: size, height: size });
    }
    for (const size of [128, 256, 512]) {
      expect(
        await sharp(publicPath(`favicon-${size}.jpg`)).metadata()
      ).toMatchObject({ width: size, height: size, format: 'jpeg' });
    }
    const ico = await readFile(publicPath('favicon.ico'));
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBe(6);
    const sizes = Array.from(
      { length: 6 },
      (_, index) => ico[6 + index * 16] || 256
    );
    expect(sizes).toEqual([16, 32, 48, 64, 128, 256]);
    for (let index = 0; index < 6; index++) {
      const offset = ico.readUInt32LE(18 + index * 16);
      expect(ico.subarray(offset, offset + 8)).toEqual(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
      );
    }
    const manifest = JSON.parse(
      await readFile(publicPath('site.webmanifest'), 'utf8')
    );
    expect(manifest.icons.map(({ sizes }: { sizes: string }) => sizes)).toEqual(
      ['192x192', '512x512']
    );
    expect(
      manifest.icons.every(
        ({ purpose }: { purpose: string }) => purpose === 'any'
      )
    ).toBe(true);
    expect(
      await sharp(publicPath('images', 'banner-farhan-sheth.png')).metadata()
    ).toMatchObject({ width: 1584, height: 396 });
    expect(
      await sharp(publicPath('images', 'og-research-atlas-2x.png')).metadata()
    ).toMatchObject({ width: 2400, height: 1260 });
  });

  it('retains the exact approved mark and verifies every archived identity asset', async () => {
    const digest = (bytes: Buffer) =>
      createHash('sha256').update(bytes).digest('hex');
    expect(
      digest(await readFile(resolve('src/assets/favicon-selected.png')))
    ).toBe('f4bd54d21546e6606ae2b151cab0374a6d7891da20f9704e6e89ca8952f5665a');
    const folder = resolve('src/assets/backups/2026-10-28-before-fs-ligature');
    const manifest = JSON.parse(
      await readFile(resolve(folder, 'manifest.json'), 'utf8')
    );
    expect(manifest.files.length).toBeGreaterThanOrEqual(15);
    for (const { backup, sha256 } of manifest.files) {
      expect(digest(await readFile(resolve(folder, backup)))).toBe(sha256);
    }
  });
  it('ships fixed-dimension portrait and social-image derivatives', async () => {
    const portrait = await sharp(
      publicPath('images', 'profile-img-487.webp')
    ).metadata();
    const social = await sharp(
      publicPath('images', 'og-research-atlas.jpg')
    ).metadata();
    const retina = await sharp(
      publicPath('images', 'profile-img-960.webp')
    ).metadata();
    const master = await sharp(
      resolve('src/assets/portrait-selected.png')
    ).metadata();

    expect(portrait).toMatchObject({ height: 617, width: 487 });
    expect(retina).toMatchObject({ height: 1216, width: 960 });
    expect(master.width).toBeGreaterThanOrEqual(960);
    expect(social).toMatchObject({ height: 630, width: 1200 });
  });

  it('self-hosts every approved font role with its license and atlas vectors', async () => {
    await expect(
      access(publicPath('fonts', 'newsreader-latin.woff2'))
    ).resolves.toBeUndefined();
    await expect(
      access(publicPath('fonts', 'manrope-latin.woff2'))
    ).resolves.toBeUndefined();
    await expect(
      access(publicPath('fonts', 'ibm-plex-mono-latin-400.woff2'))
    ).resolves.toBeUndefined();
    await expect(
      access(publicPath('fonts', 'ibm-plex-mono-latin-500.woff2'))
    ).resolves.toBeUndefined();
    await expect(
      access(publicPath('fonts', 'LICENSES.md'))
    ).resolves.toBeUndefined();
    await expect(
      stat(publicPath('fonts', 'manrope-latin.woff2')).then(({ size }) => size)
    ).resolves.toBeLessThan(18_000);
    await expect(
      stat(publicPath('fonts', 'newsreader-latin.woff2')).then(
        ({ size }) => size
      )
    ).resolves.toBeLessThan(25_000);

    const atlas = await readFile(
      publicPath('icons', 'research-atlas.svg'),
      'utf8'
    );
    expect(atlas).toContain('Healthcare &amp; Clinical AI');
    expect(atlas).toContain('Earth &amp; Agricultural Intelligence');
  });

  it('preloads the compact body face used by the mobile LCP text', async () => {
    const [layout, tokens] = await Promise.all([
      readFile(resolve('src', 'layouts', 'BaseLayout.astro'), 'utf8'),
      readFile(resolve('src', 'styles', 'tokens.css'), 'utf8')
    ]);

    expect(layout).toContain('href="/fonts/manrope-latin.woff2"');
    expect(tokens).toMatch(
      /font-family: 'Manrope Atlas';[\s\S]*?font-display: swap;/
    );
  });

  it('ships a complete favicon set and theme-aware atlas/category source assets', async () => {
    await expect(access(publicPath('favicon-16.png'))).resolves.toBeUndefined();
    await expect(access(publicPath('favicon-32.png'))).resolves.toBeUndefined();
    await expect(
      access(publicPath('apple-touch-icon.png'))
    ).resolves.toBeUndefined();
    const [favicon16, favicon32, touchIcon, layout] = await Promise.all([
      sharp(publicPath('favicon-16.png')).metadata(),
      sharp(publicPath('favicon-32.png')).metadata(),
      sharp(publicPath('apple-touch-icon.png')).metadata(),
      readFile(resolve('src', 'layouts', 'BaseLayout.astro'), 'utf8')
    ]);
    expect(favicon16).toMatchObject({ height: 16, width: 16 });
    expect(favicon32).toMatchObject({ height: 32, width: 32 });
    expect(touchIcon).toMatchObject({ height: 180, width: 180 });
    expect(layout).toContain('rel="apple-touch-icon"');
    expect(layout).toContain('href="/favicon-32.png"');

    const iconSources = await Promise.all(
      [
        'research-atlas.svg',
        'category-healthcare.svg',
        'category-earth.svg',
        'category-multimodal.svg',
        'category-privacy.svg',
        'category-scientific.svg',
        'category-speech.svg'
      ].map((file) => readFile(publicPath('icons', file), 'utf8'))
    );

    for (const icon of iconSources) {
      expect(icon).toContain('prefers-color-scheme:dark');
      expect(icon).toContain('<title');
    }
  });
});

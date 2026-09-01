import { access, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const publicPath = (...parts: string[]) => resolve('public', ...parts);

describe('Editorial Research Atlas assets', () => {
  it('ships fixed-dimension portrait and social-image derivatives', async () => {
    const portrait = await sharp(
      publicPath('images', 'profile-img-487.webp')
    ).metadata();
    const social = await sharp(
      publicPath('images', 'og-research-atlas.jpg')
    ).metadata();

    expect(portrait).toMatchObject({ height: 617, width: 487 });
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

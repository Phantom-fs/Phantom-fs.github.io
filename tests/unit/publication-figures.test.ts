import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { publicationFigureSchema } from '../../src/lib/content/contracts';
import { loadValidatedContent } from '../../src/lib/content/query';
import { toCatalogPublication } from '../../src/lib/publications/catalog';

describe('publication figure coverage and provenance', () => {
  it('pairs every current catalogue entry with distinct, source-traceable and uncropped assets', async () => {
    const content = await loadValidatedContent(resolve('src/content'));
    const manifest = JSON.parse(
      await readFile('src/assets/publication-figures/manifest.json', 'utf8')
    );
    expect(manifest).toHaveLength(content.publications.length);
    const sources = new Set();
    for (const publication of content.publications) {
      const figure = publication.data.figure;
      expect(figure, publication.data.id).toBeDefined();
      if (!figure) continue;
      const entry = manifest.find(
        (item: { id: string }) => item.id === publication.data.id
      );
      expect(entry.page).toBe(figure.page);
      expect(entry.label).toBe(figure.label);
      expect(entry.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.cropNormalized).toHaveLength(4);
      const source = await readFile(
        `src/assets/publication-figures/${publication.data.id}.png`
      );
      expect(createHash('sha256').update(source).digest('hex')).toBe(
        entry.extractedSha256
      );
      const full = await sharp(`public${figure.src}`).metadata();
      expect([full.width, full.height]).toEqual([figure.width, figure.height]);
      for (const width of [320, 640]) {
        const thumbnail = await sharp(
          `public${figure.src.replace('.webp', `-${width}.webp`)}`
        ).metadata();
        expect(thumbnail.width).toBe(Math.min(width, figure.width));
        expect(thumbnail.height! / thumbnail.width!).toBeCloseTo(
          figure.height / figure.width,
          2
        );
      }
      expect(toCatalogPublication(publication).figure).toEqual(figure);
      sources.add(figure.src);
    }
    expect(sources.size).toBe(content.publications.length);
  });

  it('rejects unsafe paths, missing descriptions and invalid page/dimension values for future figures', () => {
    const valid = {
      src: '/images/publications/future-paper.webp',
      alt: 'Model pipeline with two encoders and a fusion head.',
      caption: 'Framework overview.',
      label: 'Figure 1',
      page: 3,
      width: 1600,
      height: 900
    };
    expect(publicationFigureSchema.safeParse(valid).success).toBe(true);
    for (const invalid of [
      { src: 'https://example.com/figure.webp' },
      { src: '/images/publications/../figure.webp' },
      { alt: '' },
      { caption: '' },
      { page: 0 },
      { width: -1 }
    ]) {
      expect(
        publicationFigureSchema.safeParse({ ...valid, ...invalid }).success
      ).toBe(false);
    }
  });
});

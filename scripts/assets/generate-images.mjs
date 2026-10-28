import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { generateBrandAssets } from './generate-brand-assets.mjs';
import { generatePublicationFigures } from './generate-publication-figures.mjs';

const root = resolve(import.meta.dirname, '../..');
const source = resolve(root, 'src/assets/portrait-selected.png');
const output = resolve(root, 'public/images');

await mkdir(output, { recursive: true });
await sharp(source)
  .jpeg({ mozjpeg: true, quality: 94 })
  .toFile(resolve(output, 'profile-img.jpg'));
await Promise.all(
  [
    '.asset-generation-complete',
    'profile-img-640.avif',
    'profile-img-640.webp',
    'profile-img-640.jpg'
  ].map((file) => rm(resolve(output, file), { force: true }))
);

for (const width of [320, 487, 960]) {
  const height = Math.round((width * 617) / 487);
  await sharp(source)
    .resize({ height, width, withoutEnlargement: true })
    .avif({ quality: 72 })
    .toFile(resolve(output, `profile-img-${width}.avif`));
  await sharp(source)
    .resize({ height, width, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(resolve(output, `profile-img-${width}.webp`));
  if (width >= 487) {
    await sharp(source)
      .resize({ height, width, withoutEnlargement: true })
      .jpeg({ mozjpeg: true, quality: 88 })
      .toFile(resolve(output, `profile-img-${width}.jpg`));
  }
}

await generateBrandAssets({ root, portraitSource: source });
await generatePublicationFigures(root);

await writeFile(
  resolve(output, 'visitor-map-fallback.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 400" role="img" aria-labelledby="title desc"><title id="title">Global reach placeholder</title><desc id="desc">A static, privacy-preserving placeholder used when the optional visitor map is blocked.</desc><rect width="960" height="400" fill="#FFFFFF"/><path d="M80 230C208 111 350 307 468 202S738 131 889 236" fill="none" stroke="#4C6A92" stroke-width="3"/><g fill="#7B8E78"><circle cx="190" cy="162" r="8"/><circle cx="468" cy="202" r="8"/><circle cx="735" cy="166" r="8"/></g><text x="480" y="343" fill="#56616A" font-family="Arial, sans-serif" font-size="24" text-anchor="middle">Visitor map unavailable · no location data requested</text></svg>`
);

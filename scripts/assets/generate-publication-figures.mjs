import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

export const generatePublicationFigures = async (root) => {
  const source = resolve(root, 'src/assets/publication-figures');
  const output = resolve(root, 'public/images/publications');
  const manifest = JSON.parse(
    await readFile(resolve(source, 'manifest.json'), 'utf8')
  );
  await mkdir(output, { recursive: true });
  for (const { id } of manifest) {
    const image = resolve(source, `${id}.png`);
    // Keep fine diagram labels intact; the original-size view is lossless.
    await sharp(image)
      .webp({ lossless: true })
      .toFile(resolve(output, `${id}.webp`));
    for (const width of [320, 640]) {
      await sharp(image)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 88, smartSubsample: true })
        .toFile(resolve(output, `${id}-${width}.webp`));
    }
  }
};

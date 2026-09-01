import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '../..');
const source = resolve(root, 'public/images/profile-img.jpg');
const output = resolve(root, 'public/images');
const faviconSource = resolve(root, 'public/favicon.svg');

await mkdir(output, { recursive: true });
await Promise.all(
  [
    '.asset-generation-complete',
    'profile-img-640.avif',
    'profile-img-640.webp',
    'profile-img-640.jpg'
  ].map((file) => rm(resolve(output, file), { force: true }))
);

for (const width of [320, 487]) {
  const height = Math.round((width * 617) / 487);
  await sharp(source)
    .resize({ height, width, withoutEnlargement: width > 487 })
    .avif({ quality: 72 })
    .toFile(resolve(output, `profile-img-${width}.avif`));
  await sharp(source)
    .resize({ height, width, withoutEnlargement: width > 487 })
    .webp({ quality: 82 })
    .toFile(resolve(output, `profile-img-${width}.webp`));
}

await sharp(source)
  .resize({ height: 617, width: 487, withoutEnlargement: true })
  .jpeg({ mozjpeg: true, quality: 88 })
  .toFile(resolve(output, 'profile-img-487.jpg'));

const favicon = await readFile(faviconSource);
await Promise.all([
  sharp(favicon)
    .resize(16, 16)
    .png()
    .toFile(resolve(root, 'public/favicon-16.png')),
  sharp(favicon)
    .resize(32, 32)
    .png()
    .toFile(resolve(root, 'public/favicon-32.png')),
  sharp(favicon)
    .resize(180, 180)
    .png()
    .toFile(resolve(root, 'public/apple-touch-icon.png'))
]);

const portrait = await sharp(source)
  .resize({ height: 630, width: 430, fit: 'cover', position: 'attention' })
  .jpeg({ mozjpeg: true, quality: 88 })
  .toBuffer();
const ogSvg = Buffer.from(`
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="630" fill="#F4F1E8"/>
    <path d="M72 484C278 360 410 544 642 403S842 167 1088 259" fill="none" stroke="#24557A" stroke-width="4"/>
    <path d="M70 522C291 392 438 572 686 447" fill="none" stroke="#C8CED1" stroke-width="3"/>
    <circle cx="645" cy="402" r="10" fill="#A95738"/>
    <text x="72" y="128" fill="#161A1D" font-family="Georgia, serif" font-size="76">Farhan Sheth</text>
    <text x="77" y="188" fill="#59636B" font-family="Arial, sans-serif" font-size="30">Early-career AI researcher</text>
    <text x="77" y="250" fill="#24557A" font-family="Arial, sans-serif" font-size="24">Editorial Research Atlas</text>
  </svg>
`);

await sharp({
  create: { background: '#F4F1E8', channels: 3, height: 630, width: 1200 }
})
  .composite([
    { input: ogSvg, top: 0, left: 0 },
    { input: portrait, top: 0, left: 770 }
  ])
  .jpeg({ mozjpeg: true, quality: 88 })
  .toFile(resolve(output, 'og-research-atlas.jpg'));

await writeFile(
  resolve(output, 'visitor-map-fallback.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 400" role="img" aria-labelledby="title desc"><title id="title">Global reach placeholder</title><desc id="desc">A static, privacy-preserving placeholder used when the optional visitor map is blocked.</desc><rect width="960" height="400" fill="#FCFAF5"/><path d="M80 230C208 111 350 307 468 202S738 131 889 236" fill="none" stroke="#24557A" stroke-width="3"/><g fill="#A95738"><circle cx="190" cy="162" r="8"/><circle cx="468" cy="202" r="8"/><circle cx="735" cy="166" r="8"/></g><text x="480" y="343" fill="#59636B" font-family="Arial, sans-serif" font-size="24" text-anchor="middle">Visitor map unavailable · no location data requested</text></svg>`
);

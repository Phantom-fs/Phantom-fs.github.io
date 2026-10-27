import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const pngSizes = [16, 32, 48, 64, 96, 128, 180, 192, 256, 512, 1024];
const icoSizes = [16, 32, 48, 64, 128, 256];
const ink = '#303234';
const paper = '#FAFAF8';

const writeIco = async (path, frames) => {
  const directory = Buffer.alloc(6 + frames.length * 16);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(frames.length, 4);
  let offset = directory.length;
  frames.forEach(({ size, bytes }, index) => {
    const entry = 6 + index * 16;
    directory[entry] = size === 256 ? 0 : size;
    directory[entry + 1] = directory[entry];
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(bytes.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += bytes.length;
  });
  await writeFile(
    path,
    Buffer.concat([directory, ...frames.map((frame) => frame.bytes)])
  );
};

export const generateBrandAssets = async ({ root, portraitSource }) => {
  const publicPath = (...parts) => resolve(root, 'public', ...parts);
  const source = await readFile(
    resolve(root, 'src/assets/fs-ligature.svg'),
    'utf8'
  );
  const paths = source.match(/<path\b[\s\S]*?\/>/g)?.join('');
  if (!paths)
    throw new Error('Selected FS source has no native vector silhouette');
  const svg = (background, adaptive = false) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><title>Farhan Sheth FS monogram</title><style>.ink{fill:${ink}}.paper{fill:${paper}}${adaptive ? '@media(prefers-color-scheme:dark){.ink{fill:#FAFAF8}.paper{fill:#202325}}' : ''}</style>${background ? '<rect class="paper" width="1024" height="1024"/>' : ''}${paths}</svg>`;
  const light = Buffer.from(svg(true));
  await writeFile(publicPath('favicon.svg'), svg(true, true));
  // Explicit site theme is applied to the transparent header mark in CSS.
  await writeFile(publicPath('icons/fs-atlas-mark.svg'), svg(false));
  for (const size of pngSizes) {
    await sharp(light)
      .resize(size, size)
      .png()
      .toFile(publicPath(`favicon-${size}.png`));
  }
  for (const size of [128, 256, 512]) {
    await sharp(light)
      .resize(size, size)
      .jpeg({ mozjpeg: true, quality: 94 })
      .toFile(publicPath(`favicon-${size}.jpg`));
  }
  await copyFile(publicPath('favicon-512.png'), publicPath('favicon.png'));
  await copyFile(publicPath('favicon-96.png'), publicPath('favicon-96x96.png'));
  await copyFile(publicPath('favicon-512.jpg'), publicPath('favicon.jpg'));
  await copyFile(
    publicPath('favicon-180.png'),
    publicPath('apple-touch-icon.png')
  );
  await writeIco(
    publicPath('favicon.ico'),
    await Promise.all(
      icoSizes.map(async (size) => ({
        size,
        bytes: await readFile(publicPath(`favicon-${size}.png`))
      }))
    )
  );
  await writeFile(
    publicPath('site.webmanifest'),
    `${JSON.stringify(
      {
        name: 'Farhan Sheth — AI researcher',
        short_name: 'Farhan Sheth',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: paper,
        theme_color: paper,
        icons: [192, 512].map((size) => ({
          src: `/favicon-${size}.png`,
          sizes: `${size}x${size}`,
          type: 'image/png',
          purpose: 'any'
        }))
      },
      null,
      2
    )}\n`
  );

  const photo = `data:image/jpeg;base64,${(await sharp(portraitSource).jpeg({ mozjpeg: true, quality: 94 }).toBuffer()).toString('base64')}`;
  const monogram = (x, y, size) =>
    `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 1024 1024"><g fill="${ink}">${paths.replace('fill="currentColor"', `fill="${ink}"`)}</g></svg>`;
  const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="${paper}"/>
    ${monogram(58, 50, 76)}
    <text x="64" y="174" fill="#56616A" font-family="Arial, sans-serif" font-size="25">AI researcher</text>
    <text x="60" y="259" fill="${ink}" font-family="Georgia, serif" font-size="78">Farhan Sheth</text>
    <text x="64" y="332" fill="#4C6A92" font-family="Arial, sans-serif" font-size="31">Multimodal &amp; trustworthy AI</text>
    <text x="64" y="384" fill="#56616A" font-family="Arial, sans-serif" font-size="23">Clinical privacy · speech forensics</text>
    <text x="64" y="421" fill="#56616A" font-family="Arial, sans-serif" font-size="23">Scientific ML · agricultural intelligence</text>
    <path d="M64 501H706" stroke="#D9D9D6"/>
    <text x="64" y="548" fill="${ink}" font-family="Arial, sans-serif" font-size="25">farhansheth.com</text>
    <defs><clipPath id="portrait"><rect x="782" y="91" width="354" height="448" rx="12"/></clipPath></defs>
    <image href="${photo}" x="782" y="91" width="354" height="448" preserveAspectRatio="xMidYMid meet" clip-path="url(#portrait)"/>
  </svg>`;
  await writeFile(publicPath('images/og-research-atlas.svg'), card);
  await sharp(Buffer.from(card))
    .jpeg({ mozjpeg: true, quality: 92 })
    .toFile(publicPath('images/og-research-atlas.jpg'));
  await sharp(Buffer.from(card))
    .png()
    .toFile(publicPath('images/og-research-atlas.png'));
  await sharp(Buffer.from(card))
    .webp({ quality: 90 })
    .toFile(publicPath('images/og-research-atlas.webp'));
  await sharp(Buffer.from(card), { density: 144 })
    .png()
    .toFile(publicPath('images/og-research-atlas-2x.png'));

  const banner = `<svg xmlns="http://www.w3.org/2000/svg" width="1584" height="396" viewBox="0 0 1584 396">
    <rect width="1584" height="396" fill="${paper}"/>
    ${monogram(54, 43, 74)}
    <text x="160" y="67" fill="#56616A" font-family="Arial, sans-serif" font-size="23">AI researcher</text>
    <text x="155" y="142" fill="${ink}" font-family="Georgia, serif" font-size="74">Farhan Sheth</text>
    <text x="160" y="213" fill="#4C6A92" font-family="Arial, sans-serif" font-size="30">Multimodal, trustworthy &amp; applied AI</text>
    <text x="160" y="262" fill="#56616A" font-family="Arial, sans-serif" font-size="23">Clinical privacy · speech forensics · scientific ML · agricultural intelligence</text>
    <text x="160" y="337" fill="${ink}" font-family="Arial, sans-serif" font-size="24">farhansheth.com</text>
    <image href="${photo}" x="1270" y="0" width="314" height="396" preserveAspectRatio="xMidYMid meet"/>
  </svg>`;
  await sharp(Buffer.from(banner))
    .png()
    .toFile(publicPath('images/banner-farhan-sheth.png'));
  await sharp(Buffer.from(banner))
    .jpeg({ mozjpeg: true, quality: 92 })
    .toFile(publicPath('images/banner-farhan-sheth.jpg'));
};

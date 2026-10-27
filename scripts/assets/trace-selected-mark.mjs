// Rebuild the native SVG silhouette from the approved raster, without redrawing it.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '../..');
const { data, info } = await sharp(
  await readFile(resolve(root, 'src/assets/favicon-selected.png'))
)
  .removeAlpha()
  .greyscale()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width, height } = info;
const ink = (x, y) =>
  x >= 0 && y >= 0 && x < width && y < height && data[y * width + x] < 150;
const edges = [];
const starts = new Map();
const add = (x, y, endX, endY, direction) => {
  const edge = { x, y, endX, endY, direction, used: false };
  edges.push(edge);
  const key = y * (width + 1) + x;
  if (!starts.has(key)) starts.set(key, []);
  starts.get(key).push(edge);
};
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (!ink(x, y)) continue;
    if (!ink(x, y - 1)) add(x, y, x + 1, y, 0);
    if (!ink(x + 1, y)) add(x + 1, y, x + 1, y + 1, 1);
    if (!ink(x, y + 1)) add(x + 1, y + 1, x, y + 1, 2);
    if (!ink(x - 1, y)) add(x, y + 1, x, y, 3);
  }
}
const loops = [];
for (const first of edges) {
  if (first.used) continue;
  const points = [];
  let edge = first;
  while (edge && !edge.used) {
    edge.used = true;
    points.push([edge.x, edge.y]);
    if (edge.endX === first.x && edge.endY === first.y) break;
    const choices = (starts.get(edge.endY * (width + 1) + edge.endX) ?? [])
      .filter((candidate) => !candidate.used)
      .sort((a, b) => {
        const rank = (candidate) =>
          [1, 0, 3, 2].indexOf((candidate.direction - edge.direction + 4) % 4);
        return rank(a) - rank(b);
      });
    edge = choices[0];
  }
  const area =
    points.reduce((sum, [x, y], index) => {
      const next = points[(index + 1) % points.length];
      return sum + x * next[1] - next[0] * y;
    }, 0) / 2;
  // Ignore isolated antialiasing/noise pixels, never letter contours/counters.
  if (Math.abs(area) > 16) loops.push(points);
}
const distance = (point, a, b) => {
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) /
        (dx * dx + dy * dy || 1)
    )
  );
  return Math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy);
};
const simplify = (points) => {
  if (points.length <= 2) return points;
  let furthest = 0,
    maxDistance = 0;
  for (let index = 1; index < points.length - 1; index++) {
    const value = distance(points[index], points[0], points.at(-1));
    if (value > maxDistance) {
      maxDistance = value;
      furthest = index;
    }
  }
  if (maxDistance <= 1.2) return [points[0], points.at(-1)];
  return [
    ...simplify(points.slice(0, furthest + 1)).slice(0, -1),
    ...simplify(points.slice(furthest))
  ];
};
const all = loops.flat();
if (!all.length)
  throw new Error('Approved mark contains no traceable silhouette');
const minX = Math.min(...all.map((point) => point[0]));
const maxX = Math.max(...all.map((point) => point[0]));
const minY = Math.min(...all.map((point) => point[1]));
const maxY = Math.max(...all.map((point) => point[1]));
const span = Math.max(maxX - minX, maxY - minY) / 0.88;
const originX = (minX + maxX - span) / 2,
  originY = (minY + maxY - span) / 2;
const position = (point) =>
  point
    .map((value, index) =>
      (((value - (index ? originY : originX)) * 1024) / span).toFixed(1)
    )
    .join(' ');
const paths = loops
  .map((loop) => {
    let pivot = 1;
    for (let index = 2; index < loop.length; index++) {
      if (
        Math.hypot(loop[index][0] - loop[0][0], loop[index][1] - loop[0][1]) >
        Math.hypot(loop[pivot][0] - loop[0][0], loop[pivot][1] - loop[0][1])
      )
        pivot = index;
    }
    const points = [
      ...simplify(loop.slice(0, pivot + 1)).slice(0, -1),
      ...simplify([...loop.slice(pivot), loop[0]])
    ].slice(0, -1);
    const midpoint = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    // Smooth raster stair-steps along bowls, retaining hard serif/cut corners.
    const segments = points.map((point, index) => {
      const previous = points[(index + points.length - 1) % points.length];
      const next = points[(index + 1) % points.length];
      const incoming = [point[0] - previous[0], point[1] - previous[1]];
      const outgoing = [next[0] - point[0], next[1] - point[1]];
      const cosine =
        (incoming[0] * outgoing[0] + incoming[1] * outgoing[1]) /
        (Math.hypot(...incoming) * Math.hypot(...outgoing) || 1);
      const end = position(midpoint(point, next));
      return cosine < Math.cos(0.6)
        ? `L${position(point)}L${end}`
        : `Q${position(point)} ${end}`;
    });
    return `M${position(midpoint(points.at(-1), points[0]))}${segments.join('')}Z`;
  })
  .join('');
await writeFile(
  resolve(root, 'src/assets/fs-ligature.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><title>Farhan Sheth FS monogram</title><path class="ink" fill="currentColor" fill-rule="evenodd" d="${paths}"/></svg>\n`
);
console.log(
  `Traced ${loops.length} contours with 1.2px simplification and curve smoothing; original bounds ${minX},${minY}–${maxX},${maxY}`
);

import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { LinkChecker, LinkState } from 'linkinator';

const distRoot = resolve('dist');
await access(resolve(distRoot, 'index.html'));

const loopbackHosts = new Set(['127.0.0.1', 'localhost']);
const checker = new LinkChecker();
const result = await checker.check({
  path: resolve('dist'),
  recurse: true,
  linksToSkip: async (link) => {
    const url = new URL(link);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      !loopbackHosts.has(url.hostname)
    );
  }
});

const checked = result.links.filter(({ state }) => state !== LinkState.SKIPPED);
const broken = checked.filter(({ state }) => state === LinkState.BROKEN);

if (checked.length === 0) {
  throw new Error('No first-party links were checked.');
}

if (broken.length > 0) {
  for (const { parent, status, url } of broken) {
    console.error(`[${status ?? 'ERR'}] ${url} from ${parent ?? 'entrypoint'}`);
  }
  throw new Error(`${broken.length} first-party link(s) failed validation.`);
}

console.log(`Validated ${checked.length} first-party production links.`);

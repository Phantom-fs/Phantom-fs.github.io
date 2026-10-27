import type { APIRoute } from 'astro';
import { resolve } from 'node:path';
import { loadValidatedContent } from '../lib/content/query';
import { deploymentOrigin } from '../lib/ui/system';

const escapeXml = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (character) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;'
      })[character]!
  );

export const GET: APIRoute = async () => {
  const { updates } = await loadValidatedContent(resolve('src/content'));
  const items = [...updates].sort((a, b) =>
    b.data.date.localeCompare(a.data.date)
  );
  const xmlItems = items
    .map(({ data }) => {
      const link = `${deploymentOrigin}/#news-${data.id}`;
      return `<item><title>${escapeXml(`${data.paper}: ${data.title}`)}</title><link>${link}</link><guid isPermaLink="true">${link}</guid><pubDate>${new Date(`${data.date}T00:00:00Z`).toUTCString()}</pubDate><description>${escapeXml(data.summary)}</description></item>`;
    })
    .join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Farhan Sheth research updates</title><link>${deploymentOrigin}/</link><description>Research news and publication updates from Farhan Sheth.</description><language>en</language><atom:link href="${deploymentOrigin}/rss.xml" rel="self" type="application/rss+xml"/>${xmlItems}</channel></rss>`,
    { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } }
  );
};

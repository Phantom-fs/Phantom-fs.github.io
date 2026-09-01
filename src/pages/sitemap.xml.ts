import type { APIRoute } from 'astro';
import { deploymentOrigin } from '../lib/ui/system';

const xml = (routes: string[]) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((route) => `  <url><loc>${deploymentOrigin}${route}</loc></url>`).join('\n')}
</urlset>`;

export const GET: APIRoute = () =>
  new Response(xml([]), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });

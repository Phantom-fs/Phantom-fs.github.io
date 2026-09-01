import type { APIRoute } from 'astro';
import { deploymentOrigin } from '../lib/ui/system';

export const GET: APIRoute = () =>
  new Response(
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Farhan Sheth research updates</title><link>${deploymentOrigin}</link><description>Research updates are published on the About page.</description></channel></rss>`,
    { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } }
  );

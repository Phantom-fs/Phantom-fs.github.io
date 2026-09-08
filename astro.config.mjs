import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'static',
  site: 'https://phantom-fs.github.io',
  base: '/',
  integrations: [
    preact(),
    sitemap({ filter: (page) => new URL(page).pathname !== '/404.html' })
  ],
  build: {
    format: 'directory'
  }
});

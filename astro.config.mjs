import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  output: 'static',
  site: 'https://phantom-fs.github.io',
  base: '/',
  integrations: [preact()],
  build: {
    format: 'directory'
  }
});

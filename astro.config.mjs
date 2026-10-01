import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import remarkBareUrls from './src/lib/remark-bare-urls.mjs';

export default defineConfig({
  integrations: [tailwind()],
  site: 'https://todd.oftomorrow.net',
  markdown: {
    remarkPlugins: [remarkBareUrls],
  },
  // The blog index is this site's `/`; a link to the parent's /blog lands on it.
  redirects: {
    '/blog': '/'
  }
});

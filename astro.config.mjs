import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  site: 'https://todd.oftomorrow.net',
  // The blog index is this site's `/`; a link to the parent's /blog lands on it.
  redirects: {
    '/blog': '/'
  }
});

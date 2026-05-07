import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import image from '@astrojs/image';
import sitemap from '@astrojs/sitemap';
import path from 'path';

export default defineConfig({
  integrations: [
    tailwind(),
    image(),
    sitemap({
      filter: (page) => {
        // Exclude legal/policy pages from sitemap
        return !/(\/privacy(-en)?\/?$|\/terms(-en)?\/?$|\/policy\/?$)/.test(page);
      },
    }),
  ],
  site: 'https://sliding-puzzle-solver.com',
  vite: {
    resolve: {
      alias: {
        '@': path.resolve('./src'),
      },
    },
  },
}); 
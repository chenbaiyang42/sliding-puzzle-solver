import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import image from '@astrojs/image';
import path from 'path';

export default defineConfig({
  integrations: [tailwind(), image()],
  site: 'https://sliding-puzzle-solver.com',
  vite: {
    resolve: {
      alias: {
        '@': path.resolve('./src'),
      },
    },
  },
}); 
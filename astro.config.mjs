import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // GitHub Pages configuration for vadehraatharv7-hub/my-protfolio
  site: process.env.SITE || 'https://vadehraatharv7-hub.github.io',
  base: process.env.BASE_PATH || '/my-protfolio/',
  output: 'static',
  build: {
    format: 'directory',
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});

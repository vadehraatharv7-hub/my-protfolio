import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Configure for GitHub Pages deployment.
  // Set SITE and BASE_PATH via environment variables or adjust here as needed.
  site: process.env.SITE || 'https://atharvvadehra.github.io',
  base: process.env.BASE_PATH || '/',
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

import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Deployed to GitHub Pages. To move to a custom domain (e.g. https://vadehra.me)
// set the repo variables SITE=https://vadehra.me and BASE_PATH=/ and add public/CNAME.
const site = process.env.SITE || 'https://vadehraatharv7-hub.github.io';
const base = process.env.BASE_PATH || '/my-protfolio/';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, wrap: true },
  },
});

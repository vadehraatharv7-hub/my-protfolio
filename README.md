# Atharv Vadehra — Portfolio

Personal portfolio and blog of **Atharv Vadehra (ARV)**, cybersecurity MSc student at the Technical University of Denmark (DTU) and DevOps / cloud engineer based in Copenhagen.

**Live site:** https://atharvvadehra.dev

## What's on the site

- **About, experience, skills** — sourced from my resume.
- **Projects** — architecture write-ups for the AI-SOC Azure honeypot, a Proxmox + k3s Kubernetes cluster, a RAG / vector search system, enterprise cloud security work and a WhatsApp appointment bot.
- **Writing** — project write-ups and commentary on cybersecurity and AI news, with an RSS feed.
- **Resume** — an online version and a downloadable PDF.

## Built with

[Astro](https://astro.build) (static output), Markdown content collections, plain CSS with light and dark themes. Hosted on GitHub Pages and deployed by GitHub Actions on every push to `main`. DNS is managed in Cloudflare.

## Search and AI discoverability

Canonical URLs, Open Graph and Twitter cards, JSON-LD structured data (Person, WebSite, ProfilePage, FAQPage, BlogPosting, breadcrumbs), an XML sitemap, `robots.txt`, an RSS feed, and `llms.txt` / `llms-full.txt` for LLM-based search.

## Project layout

```text
src/
  config.ts          identity data, site description, blog categories
  data/profile.ts    experience, education, skills, FAQ
  content/blog/      published posts (Markdown)
  content/projects/  project write-ups (Markdown)
  pages/             routes, including rss.xml, robots.txt and llms.txt
  layouts/, components/, lib/, styles/
drafts/              post templates and unpublished material (not built)
public/              favicon, headshot, social image, resume PDF, CNAME
scripts/make-og.mjs  regenerates the social image
```

## Local development

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static output in dist/
npm run preview   # serve the production build
```

## Writing a post

Copy a template from `drafts/` to `src/content/blog/<slug>.md`, fill in the frontmatter (`category` is `writeup`, `cyber-news` or `ai-news`), add sources, and set `draft: false`. Pushing to `main` publishes it and updates the feed, sitemap and `llms.txt`.

## Deployment

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages. The domain is set in `public/CNAME` and `astro.config.mjs`. Optional repository variables `PUBLIC_GOOGLE_SITE_VERIFICATION` and `PUBLIC_BING_SITE_VERIFICATION` add search-console verification tags.

## Contact

[atharv@vadehra.me](mailto:atharv@vadehra.me) · [LinkedIn](https://www.linkedin.com/in/atharv-vadehra/) · [GitHub](https://github.com/vadehraatharv7-hub)

© Atharv Vadehra. All rights reserved.

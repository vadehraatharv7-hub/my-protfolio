# Atharv Vadehra (ARV) — portfolio & blog

Astro static site, deployed to GitHub Pages by `.github/workflows/deploy.yml`.

## Publish a post
1. Copy `drafts/TEMPLATE-writeup.md` (project write-up) or `drafts/TEMPLATE-news.md` (cyber/AI news) to `src/content/blog/<slug>.md`.
2. Fill in the frontmatter (`category`: `writeup` | `cyber-news` | `ai-news`), add sources, set `draft: false`.
3. Commit and push to `main`. RSS, sitemap, `llms.txt` and JSON-LD update automatically.

Projects live in `src/content/projects/`. Identity data is in `src/config.ts` and `src/data/profile.ts`.

## SEO / GEO checklist
- Move to a root domain (e.g. `https://vadehra.me`): set repo variables `SITE` and `BASE_PATH=/`, add `public/CNAME`. `robots.txt` and `llms.txt` only work at a domain root.
- Verify in Google Search Console and Bing Webmaster Tools; set `PUBLIC_GOOGLE_SITE_VERIFICATION` / `PUBLIC_BING_SITE_VERIFICATION`, submit `sitemap-index.xml`.
- Use "Atharv Vadehra" and "ARV" consistently on LinkedIn, GitHub, and other profiles, linking back to this site.

## Develop
`npm install && npm run dev` · `npm run build` · `node scripts/make-og.mjs` regenerates the social image.

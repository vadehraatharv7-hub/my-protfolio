import type { APIContext } from 'astro';
import { path } from '../lib/url';

// NOTE: crawlers only read /robots.txt at the *domain root*. On a GitHub Pages project site
// (…github.io/my-protfolio/) this file is not discovered; it takes effect on a custom domain.
// AI search and answer-engine crawlers are explicitly allowed.
const AI_BOTS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'anthropic-ai',
  'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'DuckAssistBot', 'CCBot', 'Meta-ExternalAgent',
];

export function GET(context: APIContext) {
  const sitemap = new URL(path('/sitemap-index.xml'), context.site).toString();
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    ...AI_BOTS.flatMap((b) => [`User-agent: ${b}`, 'Allow: /', '']),
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/posts';
import { SITE_TITLE, DEFAULT_DESCRIPTION } from '../config';
import { path } from '../lib/url';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: `${SITE_TITLE} — writing`,
    description: DEFAULT_DESCRIPTION,
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: path(`/blog/${p.id}/`),
      categories: [p.data.category, ...p.data.tags],
      author: 'atharv@vadehra.me (Atharv Vadehra)',
    })),
    customData: '<language>en</language>',
  });
}

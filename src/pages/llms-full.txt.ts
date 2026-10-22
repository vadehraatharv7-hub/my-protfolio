import type { APIContext } from 'astro';
import { getPosts, getProjects } from '../lib/posts';
import { PERSON, DEFAULT_DESCRIPTION } from '../config';
import { experience, education, skills, faq } from '../data/profile';
import { abs } from '../lib/url';

export async function GET(_ctx: APIContext) {
  const projects = await getProjects();
  const posts = await getPosts();
  const out: string[] = [
    `# ${PERSON.name} (ARV) — full profile`,
    '',
    DEFAULT_DESCRIPTION,
    '',
    `Canonical site: ${abs('/')}`,
    `Contact: ${PERSON.email} · ${PERSON.linkedin} · ${PERSON.github}`,
    '',
    '## Education',
    ...education.map((e) => `- ${e.school} — ${e.degree}, ${e.place} (${e.dates})`),
    '',
    '## Experience',
    ...experience.flatMap((e) => [`### ${e.role} — ${e.org} (${e.kind}, ${e.dates})`, ...e.points.map((p) => `- ${p}`), '']),
    '## Skills',
    ...skills.map(([k, v]) => `- ${k}: ${v}`),
    '',
    '## FAQ',
    ...faq.flatMap(([q, a]) => [`**${q}**`, a, '']),
    '## Projects',
    ...projects.flatMap((p) => [`### ${p.data.title}`, `URL: ${abs(`/projects/${p.id}/`)}`, p.data.description, `Technologies: ${p.data.technologies.join(', ')}`, '']),
  ];
  if (posts.length) {
    out.push('## Writing', '');
    for (const p of posts) out.push(`### ${p.data.title}`, `URL: ${abs(`/blog/${p.id}/`)} · ${p.data.date.toISOString().slice(0, 10)}`, '', p.body ?? '', '');
  }
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

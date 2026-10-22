import type { APIContext } from 'astro';
import { getPosts, getProjects } from '../lib/posts';
import { PERSON, DEFAULT_DESCRIPTION } from '../config';
import { abs } from '../lib/url';

// llms.txt (https://llmstxt.org): a concise, machine-readable map of the site for LLM-based search and assistants.
export async function GET(_ctx: APIContext) {
  const projects = await getProjects();
  const posts = await getPosts();
  const lines = [
    `# ${PERSON.name} (ARV)`,
    '',
    `> ${DEFAULT_DESCRIPTION}`,
    '',
    `${PERSON.name}, also known as ARV, is based in ${PERSON.location}. He is a cybersecurity MSc student at the Technical University of Denmark (DTU) and a DevOps / cloud engineer (Kubernetes, Terraform, AWS, GCP, Azure). He is seeking a part-time studentermedhjælper role (up to 90 hours/month).`,
    '',
    '## Identity',
    `- [Home / profile](${abs('/')}): bio, experience, skills, FAQ`,
    `- [Resume](${abs('/resume/')}): education and work history`,
    `- [LinkedIn](${PERSON.linkedin})`,
    `- [GitHub](${PERSON.github})`,
    `- Email: ${PERSON.email}`,
    '',
    '## Projects',
    ...projects.map((p) => `- [${p.data.title}](${abs(`/projects/${p.id}/`)}): ${p.data.tagline}`),
    '',
    '## Writing',
    ...(posts.length ? posts.map((p) => `- [${p.data.title}](${abs(`/blog/${p.id}/`)}): ${p.data.description}`) : ['- Project write-ups and cyber/AI news notes are published at ' + abs('/blog/')]),
    '',
    '## Optional',
    `- [Full content for LLMs](${abs('/llms-full.txt')})`,
    `- [RSS feed](${abs('/rss.xml')})`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

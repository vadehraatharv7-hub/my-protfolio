import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Blog Content Collection (Astro 5 Content Layer)
 * Strictly matches the requested YAML frontmatter schema:
 * - title: string
 * - subtitle: string
 * - date: string
 * - time: string
 * - header_image: string
 * - author: string (Default: Atharv Vadehra)
 * - sources: array of links/references
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    date: z.string(),
    time: z.string(),
    header_image: z.string(),
    author: z.string().default('Atharv Vadehra'),
    sources: z.array(z.string()).default([]),
    tags: z.array(z.string()).optional().default([]),
    classification: z.string().optional().default('RESTRICTED // EYES ONLY'),
  }),
});

/**
 * Projects Content Collection (Astro 5 Content Layer)
 * Enables rich, markdown-driven documentation sub-pages for each project
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    description: z.string(),
    category: z.enum(['Cloud Security', 'DevOps & IaC', 'Network Security', 'Homelab & Virtualization', 'Distributed Systems']),
    technologies: z.array(z.string()),
    github: z.string(),
    demo: z.string().optional(),
    featured: z.boolean().default(true),
    status: z.string().default('ACTIVE DEPLOYMENT'),
    architecture_overview: z.string().optional(),
    threat_model: z.string().optional(),
    metrics: z.record(z.string()).optional(),
  }),
});

export const collections = {
  blog,
  projects,
};

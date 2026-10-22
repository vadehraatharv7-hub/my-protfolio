import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Unpublished material (templates, old drafts) lives in /drafts, outside the collections.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(200, 'Keep descriptions under 200 characters for search snippets'),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    category: z.enum(['writeup', 'cyber-news', 'ai-news']),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    // Related project slug (src/content/projects/<slug>.md) for write-ups
    project: z.string().optional(),
    sources: z.array(z.object({ title: z.string(), url: z.string().url() })).default([]),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    description: z.string(),
    category: z.enum(['Cloud Security', 'DevOps & IaC', 'Network Security', 'Homelab & Virtualization', 'Distributed Systems']),
    technologies: z.array(z.string()),
    github: z.string().url(),
    demo: z.string().url().optional(),
    order: z.number().default(99),
    featured: z.boolean().default(true),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, projects };

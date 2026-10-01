import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const eventSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date().optional(),
  mode: z.enum(['offline', 'online', 'hybrid']).default('offline'),
  venue: z.string().optional(),
  address: z.string().optional(),
  onlineUrl: z.string().optional(),
  contact: z.string().optional(),
  status: z.enum(['scheduled', 'cancelled', 'done']).default('scheduled'),
});

const posts = defineCollection({
  loader: glob({ pattern: '*.md', base: 'src/content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      image: image().optional(),
      draft: z.boolean().default(false),
      social: z.boolean().default(false),
      socialText: z.string().optional(),
      atUri: z.string().optional(),
      event: eventSchema.optional(),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string(),
    lang: z.enum(['ja', 'en']).default('ja'),
  }),
});

const settings = defineCollection({
  loader: glob({ pattern: '*.yml', base: 'src/content/settings' }),
  schema: z.any(),
});

export const collections = { posts, pages, settings };

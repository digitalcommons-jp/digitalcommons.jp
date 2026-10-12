import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// Sveltia CMS writes an empty optional field as '' (or null for an empty object). Treat those as
// "not set" so a post saved with blank optional fields still builds.
const blank = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), schema);

const eventSchema = z.object({
  start: z.coerce.date(),
  end: blank(z.coerce.date().optional()),
  /** Free-text date shown instead of `start` (e.g. "2026年未定"). `start` still drives the sort order. */
  when: blank(z.string().optional()),
  fee: blank(z.string().optional()),
  /** Show this event as the hero (otherwise the most recent event is used). */
  pickup: z.boolean().default(false),
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
      updated: blank(z.coerce.date().optional()),
      tags: z.array(z.string()).default([]),
      image: blank(image().optional()),
      draft: z.boolean().default(false),
      social: z.boolean().default(false),
      socialText: blank(z.string().optional()),
      atUri: blank(z.string().optional()),
      event: blank(eventSchema.optional()),
    }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: 'src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      /** Every project has a goal and a deliverable. */
      goal: z.string(),
      deliverable: z.string(),
      /** Show this project as the hero (otherwise the newest project is used). */
      pickup: z.boolean().default(false),
      date: z.coerce.date(),
      status: z.enum(['ongoing', 'done']).default('ongoing'),
      url: blank(z.string().optional()),
      image: blank(image().optional()),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: 'src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string(),
  }),
});

const settings = defineCollection({
  loader: glob({ pattern: '*.yml', base: 'src/content/settings' }),
  schema: z.any(),
});

export const collections = { posts, projects, pages, settings };

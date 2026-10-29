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
      /** Where the project is: メンバー募集中 / 進行中 / 完了. */
      phase: z.enum(['prepare', 'build', 'close']).default('prepare'),
      url: blank(z.string().optional()),
      image: blank(image().optional()),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: 'src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      slug: z.string(),
      // Hero picture (see 04_page/01_hero.astro): an uploaded `image` wins; otherwise `art` (any word) generates a
      // picture from that seed; with neither there is none.
      image: blank(image().optional()),
      art: blank(z.string().optional()),
      // Where the picture starts: beside the title, or beside the lead text. And whether the text flows around it.
      artPosition: blank(z.enum(['title', 'body']).default('title')),
      artWrap: blank(z.boolean().default(true)),
      // Only the about page uses the fields below (see pages/about.astro).
      lead: blank(z.string().optional()), // hero text (any page; default: description); paragraphs are separated by a blank line
      mission: blank(z.object({ title: z.string(), text: z.string() }).optional()),
      approaches: blank(z.array(z.object({ title: z.string(), text: z.string() })).optional()),
      members: blank(
        z
        .array(
          z.object({
            name: z.string(),
            languages: blank(z.string().optional()), // e.g. "EN, FR": shown as small labels beside the name
            bluesky: blank(z.string().optional()),
            mastodon: blank(z.string().optional()),
            didwebvh: blank(z.string().optional()),
            chat: blank(z.string().optional()), // URL of a chat room or profile
            email: blank(z.string().optional()), // an address (shown as a mailto: link)
            pgp: blank(z.object({ fingerprint: z.string(), file: z.string() }).optional()),
          }),
        )
        .optional(),
      ),
      donation: blank(z.object({ title: z.string(), text: z.string(), button: z.string(), href: z.string() }).optional()),
      overviewTitle: blank(z.string().optional()), // heading of the overview card (default: 団体概要)
      overview: blank(z.array(z.object({ label: z.string(), value: z.string() })).optional()),
      // Only the join page uses `follow` (see 10_join/05_follow.astro).
      follow: blank(z.object({ title: z.string(), text: z.string() }).optional()),
          }),
});

const settings = defineCollection({
  loader: glob({ pattern: '*.yml', base: 'src/content/settings' }),
  schema: z.any(),
});

export const collections = { posts, projects, pages, settings };

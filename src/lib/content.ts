import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { Lang } from '~/i18n';

export type Post = CollectionEntry<'posts'>;

export const isEvent = (post: Post) => post.data.tags.includes('event') && !!post.data.event;

/** Published posts, newest first. Drafts never leave this function. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Event posts, soonest first. `upcoming` is computed at build time. */
export async function getEvents() {
  const events = (await getPosts()).filter(isEvent);
  const now = Date.now();
  const isUpcoming = (p: Post) => p.data.event!.status === 'scheduled' && p.data.event!.start.valueOf() >= now;
  const upcoming = events
    .filter(isUpcoming)
    .sort((a, b) => a.data.event!.start.valueOf() - b.data.event!.start.valueOf());
  const past = events
    .filter((p) => !isUpcoming(p))
    .sort((a, b) => b.data.event!.start.valueOf() - a.data.event!.start.valueOf());
  return { upcoming, past };
}

export async function getTags(): Promise<Map<string, Post[]>> {
  const map = new Map<string, Post[]>();
  for (const post of await getPosts()) {
    for (const tag of post.data.tags) map.set(tag, [...(map.get(tag) ?? []), post]);
  }
  return map;
}

export async function getPage(slug: string, lang: Lang = 'ja') {
  return getEntry('pages', `${lang}/${slug}`);
}

export interface SiteSettings {
  name: string;
  legalName: string;
  tagline: string;
  email: string;
  fediverse: string;
  bluesky: string;
}

export interface HomeSection {
  type: 'hero' | 'pickup' | 'intro' | 'upcoming-event' | 'latest-posts' | 'custom' | 'join-cta';
  enabled: boolean;
  slug?: string;
  count?: number;
  component?: string;
  props?: Record<string, unknown>;
}

export interface HomeSettings {
  sections: HomeSection[];
}

interface SettingsMap {
  site: SiteSettings;
  home: HomeSettings;
}

export async function getSetting<K extends keyof SettingsMap>(id: K): Promise<SettingsMap[K]> {
  const entry = await getEntry('settings', id);
  return entry?.data as SettingsMap[K];
}

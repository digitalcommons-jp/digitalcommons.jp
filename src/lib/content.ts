import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { formatDate } from '~/i18n';

export type Post = CollectionEntry<'posts'>;

export const isEvent = (post: Post) => post.data.tags.includes('event') && !!post.data.event;

/** Published posts, newest first. Drafts never leave this function. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Date text of an event: the free-text `when` if set, otherwise the formatted `start`. */
export const eventWhen = (event: NonNullable<Post['data']['event']>) => event.when ?? formatDate(event.start, true);

/** An event that is still to come (computed at build time). */
export const isUpcoming = (p: Post) => p.data.event!.status === 'scheduled' && p.data.event!.start.valueOf() >= Date.now();

/** Event posts: `upcoming` soonest first, `past` newest first. */
export async function getEvents() {
  const events = (await getPosts()).filter(isEvent);
  const upcoming = events
    .filter(isUpcoming)
    .sort((a, b) => a.data.event!.start.valueOf() - b.data.event!.start.valueOf());
  const past = events
    .filter((p) => !isUpcoming(p))
    .sort((a, b) => b.data.event!.start.valueOf() - a.data.event!.start.valueOf());
  return { upcoming, past };
}

/** The hero event: the one marked `pickup` (newest if several), otherwise the most recent by start date. */
export async function getPickedEvent() {
  const events = (await getPosts())
    .filter(isEvent)
    .sort((a, b) => b.data.event!.start.valueOf() - a.data.event!.start.valueOf());
  return events.find((p) => p.data.event!.pickup) ?? events[0];
}

/** Projects, newest first. */
export async function getProjects() {
  const projects = await getCollection('projects');
  return projects.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export type Project = CollectionEntry<'projects'>;

/** The hero project: the one marked `pickup` (newest if several), otherwise the newest. */
export async function getPickedProject() {
  const projects = await getProjects();
  return projects.find((p) => p.data.pickup) ?? projects[0];
}

export async function getTags(): Promise<Map<string, Post[]>> {
  const map = new Map<string, Post[]>();
  for (const post of await getPosts()) {
    for (const tag of post.data.tags) map.set(tag, [...(map.get(tag) ?? []), post]);
  }
  return map;
}

export interface SiteSettings {
  name: string;
  tagline: string;
  description: string;
  email: string;
  fediverse: string;
  bluesky: string;
}

interface SettingsMap {
  site: SiteSettings;
}

export async function getSetting<K extends keyof SettingsMap>(id: K): Promise<SettingsMap[K]> {
  const entry = await getEntry('settings', id);
  return entry?.data as SettingsMap[K];
}

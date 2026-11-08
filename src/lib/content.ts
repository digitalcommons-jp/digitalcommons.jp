import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { formatDate, type Lang } from '~/i18n';
import { getAbout } from './about';

/** Collection name of a language: `posts` (ja) or `en_posts`. */
const col = <N extends 'posts' | 'projects' | 'pages' | 'settings'>(name: N, lang: Lang) =>
  (lang === 'en' ? `en_${name}` : name) as N;

export type Post = CollectionEntry<'posts'>;

export const isEvent = (post: Post) => post.data.tags.includes('event') && !!post.data.event;

/** Published posts, newest first. Drafts never leave this function. */
export async function getPosts(lang: Lang = 'ja'): Promise<Post[]> {
  const posts = await getCollection(col('posts', lang), ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Date text of an event: the free-text `when` if set, otherwise the formatted `start`. */
export const eventWhen = (event: NonNullable<Post['data']['event']>, lang: Lang = 'ja') =>
  event.when ?? formatDate(event.start, true, lang);

/** An event that is still to come (computed at build time). */
export const isUpcoming = (p: Post) => p.data.event!.status === 'scheduled' && p.data.event!.start.valueOf() >= Date.now();

/** Event posts: `upcoming` soonest first, `past` newest first. */
export async function getEvents(lang: Lang = 'ja') {
  const events = (await getPosts(lang)).filter(isEvent);
  const upcoming = events
    .filter(isUpcoming)
    .sort((a, b) => a.data.event!.start.valueOf() - b.data.event!.start.valueOf());
  const past = events
    .filter((p) => !isUpcoming(p))
    .sort((a, b) => b.data.event!.start.valueOf() - a.data.event!.start.valueOf());
  return { upcoming, past };
}

/** The hero event: the one marked `pickup` (newest if several), otherwise the most recent by start date. */
export async function getPickedEvent(lang: Lang = 'ja') {
  const events = (await getPosts(lang))
    .filter(isEvent)
    .sort((a, b) => b.data.event!.start.valueOf() - a.data.event!.start.valueOf());
  return events.find((p) => p.data.event!.pickup) ?? events[0];
}

/** Projects, newest first. */
export async function getProjects(lang: Lang = 'ja') {
  const projects = await getCollection(col('projects', lang));
  return projects.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export type Project = CollectionEntry<'projects'>;

/** The hero project: the one marked `pickup` (newest if several), otherwise the newest. */
export async function getPickedProject(lang: Lang = 'ja') {
  const projects = await getProjects(lang);
  return projects.find((p) => p.data.pickup) ?? projects[0];
}

/** A fixed page (`about`, `join`, …) in the given language. */
export const getPage = (id: string, lang: Lang = 'ja') => getEntry(col('pages', lang), id);

/** All fixed pages in the given language. */
export const getPages = (lang: Lang = 'ja') => getCollection(col('pages', lang));

/** The donation appeal ("活動を支えませんか"): written once, in the about page's `donation`. */
export async function getDonation(lang: Lang = 'ja') {
  return (await getAbout(lang)).donation;
}

/** RSS / Bluesky / Mastodon links of the site (footer, join page). */
export async function getSocialLinks(lang: Lang = 'ja') {
  const site = await getSetting('site', lang);
  // '@user@host' -> https://host/@user
  const [, user, host] = site.fediverse.split('@');
  return [
    { label: 'RSS', href: lang === 'en' ? '/en/feed.xml' : '/feed.xml', icon: 'rss' as const },
    { label: 'Bluesky', href: `https://bsky.app/profile/${site.bluesky}`, icon: 'bluesky' as const },
    { label: 'Mastodon', href: `https://${host}/@${user}`, icon: 'mastodon' as const },
  ];
}

export async function getTags(lang: Lang = 'ja'): Promise<Map<string, Post[]>> {
  const map = new Map<string, Post[]>();
  for (const post of await getPosts(lang)) {
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

export async function getSetting<K extends keyof SettingsMap>(id: K, lang: Lang = 'ja'): Promise<SettingsMap[K]> {
  const entry = await getEntry(col('settings', lang), id);
  return entry?.data as SettingsMap[K];
}

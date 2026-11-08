import { ja, type UiKey } from './ja';
import { en } from './en';

export type Lang = 'ja' | 'en';
export const langs: Lang[] = ['ja', 'en'];

const dict: Record<Lang, Record<UiKey, string>> = { ja, en };

/** Japanese is served at `/`, English at `/en`. */
export const langOf = (pathname: string): Lang => (/^\/en(\/|$)/.test(pathname) ? 'en' : 'ja');

export const t = (key: UiKey, lang: Lang = 'ja'): string => dict[lang][key];

/** Date formatting in the page language, always in JST. */
export const formatDate = (date: Date, withTime = false, lang: Lang = 'ja'): string =>
  new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Asia/Tokyo',
  }).format(date);

/** An internal path in the given language: `/about` -> `/en/about`, `/` -> `/en`. */
export const localePath = (path: string, lang: Lang): string =>
  lang === 'en' && path.startsWith('/') ? `/en${path === '/' ? '' : path}` : path;

/** The same page in another language. */
export const switchPath = (pathname: string, to: Lang): string => {
  const bare = pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  return localePath(bare, to);
};

/** Everything a component needs to render in the language of the page it is on (from `Astro`). */
export const i18n = (astro: { url: URL }) => {
  const lang = langOf(astro.url.pathname);
  return {
    lang,
    t: (key: UiKey) => t(key, lang),
    formatDate: (date: Date, withTime = false) => formatDate(date, withTime, lang),
    link: (path: string) => localePath(path, lang),
  };
};

/** `getStaticPaths` of a page that exists once per language (`pages/[...lang]/…`; Japanese has no prefix). */
export const langPaths = () => langs.map((lang) => ({ params: { lang: lang === 'ja' ? undefined : lang } }));

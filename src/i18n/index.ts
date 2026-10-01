import { ja, type UiKey } from './ja';
import { en } from './en';

export type Lang = 'ja' | 'en';

const dictionaries: Record<Lang, Partial<Record<UiKey, string>>> = { ja, en };

export const useT =
  (lang: Lang = 'ja') =>
  (key: UiKey): string =>
    dictionaries[lang][key] ?? ja[key];

/** Path with locale prefix: Japanese at `/`, English at `/en/`. */
export const localePath = (path: string, lang: Lang = 'ja'): string => {
  const p = path.startsWith('/') ? path : `/${path}`;
  return lang === 'ja' ? p : `/en${p === '/' ? '' : p}`;
};

/** Locale-aware date formatting, always in JST. */
export const formatDate = (date: Date, lang: Lang = 'ja', withTime = false): string =>
  new Intl.DateTimeFormat(lang === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Asia/Tokyo',
  }).format(date);

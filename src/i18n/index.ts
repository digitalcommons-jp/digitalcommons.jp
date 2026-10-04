import { ja, type UiKey } from './ja';

export const t = (key: UiKey): string => ja[key];

/** Date formatting in Japanese, always in JST. */
export const formatDate = (date: Date, withTime = false): string =>
  new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Asia/Tokyo',
  }).format(date);

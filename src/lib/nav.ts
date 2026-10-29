import type { UiKey } from '~/i18n/ja';

/** Main menu. Order = display order. `btn` marks the call-to-action. Used by the header and the footer. */
export const nav: { key: UiKey; href: string; btn?: string }[] = [
  { key: 'nav.about', href: '/about' },
  { key: 'nav.actions', href: '/actions' },
  { key: 'nav.contact', href: '/contact' },
  { key: 'nav.join', href: '/join' },
];

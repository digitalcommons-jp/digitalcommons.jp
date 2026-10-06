import type { UiKey } from '~/i18n/ja';

/** Main menu. Order = display order. `btn` marks the call-to-action. Used by the header and the footer. */
export const nav: { key: UiKey; href: string; btn?: string }[] = [
  { key: 'nav.about', href: '/about' },
  { key: 'nav.events', href: '/events' },
  { key: 'nav.projects', href: '/projects' },
  { key: 'nav.join', href: '/join', btn: 'btn-primary' },
];

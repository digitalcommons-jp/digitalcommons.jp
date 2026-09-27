import { getPermalink, getBlogPermalink } from './utils/permalinks';

export const headerData = {
  links: [
    { text: '概要', href: getPermalink('/#features') },
    { text: 'ブログ', href: getBlogPermalink() },
    { text: 'About', href: getPermalink('/about') },
    { text: 'Contact', href: getPermalink('/contact') },
  ],
  actions: [],
};

export const footerData = {
  links: [
    {
      title: 'サイト',
      links: [
        { text: '概要', href: getPermalink('/#features') },
        { text: 'ブログ', href: getBlogPermalink() },
        { text: 'About', href: getPermalink('/about') },
        { text: 'Contact', href: getPermalink('/contact') },
      ],
    },
    {
      title: 'ソース',
      links: [
        { text: 'Codeberg', href: 'https://codeberg.org/digico/digitalcommons.jp' },
        { text: 'リポジトリ', href: 'https://codeberg.org/digico/digitalcommons.jp' },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [],
  footNote: `
    Digital Commons Japan
  `,
};

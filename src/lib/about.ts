import type { Lang } from '~/i18n';
import { findBlock, leaves, parseBlocks, splitByHeading, tableRows, takeHeading, textOf, toHtml } from './blocks';
import { getPage } from './content';

export interface Member {
  name: string;
  languages?: string;
  bluesky?: string;
  mastodon?: string;
  didwebvh?: string;
  chat?: string;
  email?: string;
  pgp?: { fingerprint: string; file: string };
}

/**
 * The about page, read from the directive blocks in `content/pages/about.md`:
 * :::hero, :::mission, :::approaches, :::members (::member leaves), :::overview (a table), :::donation.
 * Every block is optional; the heading inside a block is its title.
 */
export async function getAbout(lang: Lang = 'ja') {
  const page = await getPage('about', lang);
  const blocks = parseBlocks(page?.body ?? '');
  const block = (name: string) => findBlock(blocks, name);

  const heroBlock = block('hero');
  const hero = heroBlock && {
    ...(({ title, rest }) => ({ title, html: toHtml(rest) }))(takeHeading(heroBlock.nodes, 1)),
    art: heroBlock.attrs.art || undefined,
    artPosition: heroBlock.attrs.position === 'body' ? ('body' as const) : heroBlock.attrs.position === 'title' ? ('title' as const) : undefined,
    artWrap: heroBlock.attrs.wrap ? heroBlock.attrs.wrap !== 'false' : undefined,
  };

  const missionBlock = block('mission');
  const mission = missionBlock && (({ title, rest }) => ({ title, html: toHtml(rest) }))(takeHeading(missionBlock.nodes, 2));

  const approachesBlock = block('approaches');
  const approaches = approachesBlock && (({ title, rest }) => ({
    title,
    items: splitByHeading(rest, 3).sections.map((s) => ({ title: s.title, html: toHtml(s.nodes) })),
  }))(takeHeading(approachesBlock.nodes, 2));

  const membersBlock = block('members');
  const members = membersBlock && {
    title: takeHeading(membersBlock.nodes, 2).title,
    list: leaves(membersBlock.nodes, 'member').map<Member>(({ label, attrs }) => ({
      name: label,
      languages: attrs.languages,
      bluesky: attrs.bluesky,
      mastodon: attrs.mastodon,
      didwebvh: attrs.didwebvh,
      chat: attrs.chat,
      email: attrs.email,
      pgp: attrs.pgp ? { fingerprint: attrs.pgp, file: attrs['pgp-file'] ?? '' } : undefined,
    })),
  };

  const overviewBlock = block('overview');
  const overview = overviewBlock && {
    title: takeHeading(overviewBlock.nodes, 2).title,
    rows: tableRows(overviewBlock.nodes).map(([label, value]) => ({ label, value })),
  };

  const donationBlock = block('donation');
  const donation = donationBlock && (({ title, rest }) => ({
    title: title ?? textOf([]),
    html: toHtml(rest),
    button: donationBlock.attrs.button ?? '',
    href: donationBlock.attrs.href ?? '',
  }))(takeHeading(donationBlock.nodes, 2));

  return { hero, mission, approaches, members, overview, donation };
}

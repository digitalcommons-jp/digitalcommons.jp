import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Avatar from 'boring-avatars';

// Colors of the member avatars (the site palette; these are SVG fills, so they cannot use CSS variables).
const colors = ['#4aa82e', '#de9b61', '#ffd600', '#fbf3ec', '#1d4ed8'];

/**
 * Member avatar: boring-avatars ("beam"), rendered to an SVG string at build time (nothing is fetched from
 * boringavatars.com at build or run time). The same name always gives the same picture.
 */
export const memberAvatar = (name: string): string => {
  const svg = renderToStaticMarkup(createElement(Avatar, { size: 96, name, variant: 'beam', colors }));
  // React gives every render the same mask id; make it unique per member so several avatars on one page do not clash.
  const id = `avatar-${[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)}`;
  return svg.replaceAll('_R_0_', id);
};

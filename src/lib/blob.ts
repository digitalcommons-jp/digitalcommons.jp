import { Avatar, Style } from '@dicebear/core';
import definition from '@dicebear/styles/blobs.json';

const style = new Style(definition);

/**
 * Placeholder artwork: a soft, slowly moving blob picture (DiceBear "Blobs", CC0), generated at build time from a
 * seed string. The same seed always gives the same picture, and nothing is fetched from DiceBear's servers.
 * The SVG is meant to be inlined; it stops moving when the visitor prefers reduced motion.
 */
export const blobSvg = (seed: string): string =>
  new Avatar(style, { seed, animationVariant: 'slow' })
    .toString()
    .replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" ');

import { Avatar, Style } from '@dicebear/core';
import definition from '@dicebear/styles/blobs.json';
import sliceDefinition from '@dicebear/styles/slice.json';
import shapesDefinition from '@dicebear/styles/shapes.json';

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

const sliceStyle = new Style(sliceDefinition);

/**
 * Placeholder artwork for the inset rows: DiceBear "Slice" (CC0) with a transparent background (an empty
 * backgroundColor list draws no background rectangle), generated at build time from a seed string.
 */
export const sliceSvg = (seed: string): string =>
  new Avatar(sliceStyle, { seed, backgroundColor: [] })
    .toString()
    .replace('<svg ', '<svg preserveAspectRatio="xMidYMid meet" ');

const shapesStyle = new Style(shapesDefinition);

/**
 * Hero artwork: DiceBear "Shapes" (CC0) with a transparent background (an empty backgroundColor list draws no
 * background rectangle), generated at build time from a seed string.
 */
export const shapesSvg = (seed: string): string =>
  new Avatar(shapesStyle, { seed, backgroundColor: [] }).toString();

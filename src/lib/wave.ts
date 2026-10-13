/**
 * Lower edge of the white area behind the header on pages other than the landing page: a wave running from the upper
 * right down to the lower left, like the fixed one on the landing page (see `.hero::before` in style.css), but
 * different for each page. Generated at build time from a seed (the page path): the same seed always gives the
 * same wave.
 */

// Small seeded random number generator (mulberry32), so a page keeps its wave from build to build.
const rng = (seed: string) => {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  let a = Math.imul(h ^ (h >>> 16), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const between = (r: () => number, min: number, max: number) => min + (max - min) * r();
const n = (v: number) => v.toFixed(1);

/** A CSS `url(...)` value for `mask-image`. Coordinates are percentages of the box (viewBox 0 0 100 100). */
export const waveMask = (seed: string): string => {
  const r = rng(seed);
  // Anchor heights, right to left, going down: the right edge starts between 50% and 66%, the left edge ends at 100%.
  // 0.762 squashes the heights towards the bottom: the right edge starts 10 points lower (58% -> 68%) and the left edge
  // still ends at 100%.
  const squash = (y: number) => 100 - (100 - y) * 0.762;
  const ys = [between(r, 50, 66), between(r, 62, 80), between(r, 76, 92), 100].map(squash);
  const xs = [100, 66, 33, 0];
  let d = `M0 0H100V${n(ys[0])}`;
  for (let i = 1; i < xs.length; i++) {
    const sign = i % 2 ? 1 : -1; // alternate the swing so the edge really undulates
    const swing = between(r, 6, 16) * sign * 0.762;
    const x1 = xs[i - 1] - (xs[i - 1] - xs[i]) * 0.4;
    const x2 = xs[i - 1] - (xs[i - 1] - xs[i]) * 0.6;
    d += `C${n(x1)} ${n(ys[i - 1] + swing)} ${n(x2)} ${n(ys[i] - swing)} ${xs[i]} ${n(ys[i])}`;
  }
  d += 'Z';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='${d}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}")`;
};

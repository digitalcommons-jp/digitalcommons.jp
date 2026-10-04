import { SITE } from 'astrowind:config';

const trimSlash = (s: string) => s.replace(/^\/+|\/+$/g, '');

/** Absolute URL for `path`, honouring the configured trailing-slash policy. */
export const getCanonical = (path = ''): string | URL => {
  const url = String(new URL(path, SITE.site));
  if (SITE.trailingSlash == false && path && url.endsWith('/')) {
    return url.slice(0, -1);
  } else if (SITE.trailingSlash == true && path && !url.endsWith('/')) {
    return url + '/';
  }
  return url;
};

/** Site-root-relative URL for a static asset, prefixed with the configured base. */
export const getAsset = (path: string): string =>
  '/' +
  [SITE.base || '/', path]
    .map(trimSlash)
    .filter((el) => !!el)
    .join('/');

// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages project site and Codeberg Pages repo site both serve under
// /digitalcommons.jp/ — keep base in sync with those mount paths.
export default defineConfig({
  site: 'https://yno9.github.io',
  base: '/digitalcommons.jp',
  output: 'static',
  trailingSlash: 'ignore',
});

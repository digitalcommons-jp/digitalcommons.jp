// @ts-check
import { defineConfig } from 'astro/config';

// Static mock site for Codeberg Pages (custom domain: digitalcommons.jp)
export default defineConfig({
  site: 'https://digitalcommons.jp',
  output: 'static',
  trailingSlash: 'ignore',
});

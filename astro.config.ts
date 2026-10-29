import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig, fontProviders } from 'astro/config';
import { loadEnv } from 'vite';

import { unified } from '@astrojs/markdown-remark';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import compress from 'astro-compress';

import { responsiveTablesRehypePlugin } from './src/lib/markdown';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The CMS lives at a secret, unguessable path (CMS_PATH in .env, never committed): there is
// no /admin. Without CMS_PATH the CMS is simply not built.
const CMS_PATH = (loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '').CMS_PATH ?? '').replace(
  /^\/+|\/+$/g,
  ''
);
const cms = {
  name: 'cms-secret-path',
  hooks: {
    'astro:config:setup': ({
      injectRoute,
    }: {
      injectRoute: (route: { pattern: string; entrypoint: string }) => void;
    }) => {
      if (!CMS_PATH) return;
      injectRoute({ pattern: `/${CMS_PATH}`, entrypoint: './src/cms/admin.astro' });
      injectRoute({ pattern: `/${CMS_PATH}/config.yml`, entrypoint: './src/cms/config.yml.ts' });
    },
  },
};

export default defineConfig({
  site: 'https://digitalcommons.jp',
  output: 'static',
  trailingSlash: 'never',

  redirects: { '/events': '/actions', '/projects': '/actions' },

  // Native Fonts API: Astro downloads Fira Sans at build time and self-hosts it
  // (no request to a font CDN from the browser). Consumed via `--font-fira`.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Fira Sans',
      cssVariable: '--font-fira',
      weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
    {
      // The CCD reference font: only its 1ch (the cell width) is used, as --cc-w; it is not shown as text.
      provider: fontProviders.fontsource(),
      name: 'Fira Code',
      cssVariable: '--font-fira-code',
      weights: ['400'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['monospace'],
    },
  ],

  integrations: [
    react(),
    sitemap({ filter: (page) => !CMS_PATH || !page.includes(CMS_PATH) }),
    cms,
    compress({
      // csso off on purpose: its parser doesn't understand the media range
      // syntax Tailwind v4 emits for breakpoints (`@media (width>=48rem)`) and
      // silently drops every one of those blocks — the site then renders as if
      // all `md:`/`lg:` classes were missing. lightningcss parses it correctly.
      CSS: { csso: false, lightningcss: { minify: true } },
      HTML: {
        'html-minifier-terser': {
          removeAttributeQuotes: false,
        },
      },
      Image: false,
      JavaScript: true,
      SVG: false,
      Logger: 1,
    }),
  ],

  image: {
    // Emit responsive styles for the native <Image layout=…> (low-specificity selectors).
    responsiveStyles: true,
  },

  markdown: {
    processor: unified({
      rehypePlugins: [responsiveTablesRehypePlugin],
    }),
    shikiConfig: {
      // Code blocks follow the site theme;
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },

  vite: {
    // Dev only: hosts other than localhost that may reach the dev server.
    server: { allowedHosts: ['debian.lan'] },
    // Dev only: source maps so DevTools shows `style.css:<line>` (needed for Workspace saving).
    css: {
      devSourcemap: true,
      transformer: 'lightningcss',
      lightningcss: { drafts: { customMedia: true } },
    },
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
  },
});

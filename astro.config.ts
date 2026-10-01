import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig, fontProviders } from 'astro/config';

import { unified } from '@astrojs/markdown-remark';

import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';
import compress from 'astro-compress';

import astrowind from './vendor/integration';

import { readingTimeRemarkPlugin, responsiveTablesRehypePlugin } from './src/utils/frontmatter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dev only: serves /.well-known/appspecific/com.chrome.devtools.json so Chrome DevTools
// auto-connects this folder as a Workspace (edits in the Styles pane are saved to the file).
const devtoolsWorkspace = {
  name: 'devtools-workspace',
  hooks: {
    'astro:server:setup': ({ server }: { server: import('vite').ViteDevServer }) => {
      const root = path.resolve(__dirname);
      const uuidFile = path.join(root, '.astro', 'devtools-uuid');
      server.middlewares.use('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
        let uuid = fs.existsSync(uuidFile) ? fs.readFileSync(uuidFile, 'utf-8') : '';
        if (!uuid) {
          uuid = randomUUID();
          fs.mkdirSync(path.dirname(uuidFile), { recursive: true });
          fs.writeFileSync(uuidFile, uuid);
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ workspace: { root, uuid } }));
      });
    },
  },
};

export default defineConfig({
  output: 'static',

  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    routing: { prefixDefaultLocale: false },
  },

  // Native Fonts API: Astro downloads Fira Sans at build time and self-hosts it
  // (no request to a font CDN from the browser). Consumed via `--font-fira`.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Fira Sans',
      cssVariable: '--font-fira',
      weights: ['400', '700', '800'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
  ],

  integrations: [
    devtoolsWorkspace,
    sitemap({ filter: (page) => !page.includes('/admin') }),
    mdx(),
    icon({
      // Local SVG icons (used as <Icon name="file-name" />) live next to the other assets.
      iconDir: 'src/assets/icons',
      include: {
        tabler: ['*'],
        'flat-color-icons': [
          'template',
          'gallery',
          'approval',
          'document',
          'advertising',
          'currency-exchange',
          'voice-presentation',
          'business-contact',
          'database',
        ],
      },
    }),

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

    astrowind({
      config: './src/config.yaml',
    }),
  ],

  image: {
    // Astro's default Sharp service handles local images.
    //
    // Most remote CDN images (Unsplash, Cloudinary, Imgix…) are routed by
    // src/components/common/Image.astro through `unpic`, which rewrites the
    // URL with CDN-side query parameters and serves it straight from the
    // provider — Astro never downloads it, so they don't need to be listed.
    //
    // `domains` only matters for remote URLs that fall through to Astro's
    // native <Image /> (i.e. providers Unpic can't detect, like Pixabay).
    // Listed entries are authorized to be processed by Sharp.
    // Unsplash is listed so post covers can be rendered as real 1200×626 Open Graph images.

    // Emit responsive styles for the native <Image layout=…> used by
    // src/components/common/Image.astro (local images). Utility classes on
    // each usage still win, since these styles use low-specificity selectors.
    responsiveStyles: true,
  },

  markdown: {
    processor: unified({
      remarkPlugins: [readingTimeRemarkPlugin],
      rehypePlugins: [responsiveTablesRehypePlugin],
    }),
    shikiConfig: {
      // Code blocks follow the site theme;
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },

  vite: {
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

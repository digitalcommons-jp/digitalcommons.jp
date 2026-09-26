# digitalcommons.jp

Mock site for Digital Commons Japan, built with [Astro](https://astro.build) and managed with [Sveltia CMS](https://sveltiacms.app/).

## Development

```sh
npm install
npm run dev      # localhost:4321/digitalcommons.jp/
npm run build    # static output in dist/
```

## GitHub Actions (automatic build)

Pushing to GitHub (`github` remote) runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. `npm ci && npm run build` (Astro) on every push/PR
2. On `main`, deploy `dist/` to **GitHub Pages**

Public GitHub Pages URL: **https://yno9.github.io/digitalcommons.jp/**

```sh
git push github main
```

## Remotes

| Remote | URL | Role |
|--------|-----|------|
| `origin` | https://codeberg.org/digico/digitalcommons.jp.git | Codeberg source of truth + Pages |
| `github` | https://github.com/yno9/digitalcommons.jp.git | GitHub + Actions/Pages |

## Sveltia CMS

Admin UI: **`/admin/`** on the deployed site (e.g. https://yno9.github.io/digitalcommons.jp/admin/)

- Config: [`public/admin/config.yml`](public/admin/config.yml)
- Backend: GitHub `yno9/digitalcommons.jp`, branch `main`
- Auth: “Sign In with Token” (classic `repo` scope, or fine-grained Contents R/W)
- Media: `public/media/` → URL `/digitalcommons.jp/media/`
- Editable content:
  - `src/content/settings/site.json` — site title / tagline / CTA
  - `src/content/home/*.json` — homepage copy
  - `src/content/projects/*.md` — project cards
  - `src/content/posts/*.md` — posts (reserved)

Local CMS workflow: https://sveltiacms.app/en/docs/workflows/local

## Publishing (Codeberg Pages)

The public site is also served from the **`pages` branch** via [Codeberg Pages](https://docs.codeberg.org/codeberg-pages/).

```sh
npm run build
# push dist/ contents to branch `pages` on origin
```

Codeberg URL: **https://digico.codeberg.page/digitalcommons.jp/**

## Custom domain `digitalcommons.jp` (not live yet)

As of 2026-09-26 the domain has **no public DNS zone** (NXDOMAIN). Once registered, point it at Codeberg Pages and authorize this repo:

| Name | Type | Value |
|------|------|-------|
| `@` | A | `217.197.84.141` |
| `@` | AAAA | `2a0a:4580:103f:c0de::2` |
| `_git-pages-repository.digitalcommons.jp` | TXT | `https://codeberg.org/digico/digitalcommons.jp.git` |

Then redeploy (push to `pages`) and switch the webhook URL to `https://digitalcommons.jp/` after the first successful HTTPS deploy.

Note: `astro.config.mjs` currently sets `base: '/digitalcommons.jp'` for path-based hosting (GitHub Pages project site / Codeberg Pages repo site). For an apex custom domain, set `base: '/'` and `site` accordingly.

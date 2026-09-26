# digitalcommons.jp

Mock site for [Digital Commons Japan](https://digitalcommons.jp), built with [Astro](https://astro.build).

## Development

```sh
npm install
npm run dev      # localhost:4321
npm run build    # static output in dist/
```

## Publishing (Codeberg Pages)

The public site is served from the **`pages` branch** via [Codeberg Pages](https://docs.codeberg.org/codeberg-pages/).

```sh
npm run build
git subtree push --prefix dist origin pages
# or: push the contents of dist/ to a pages branch
```

## Public URL (mock)

**https://digico.codeberg.page/digitalcommons.jp/**

Codeberg Pages webhooks (Forgejo, branch filter `pages`):

- `https://digico.codeberg.page/digitalcommons.jp/`
- `http://digitalcommons.jp/` (custom domain, first deploy must be HTTP)

## Custom domain `digitalcommons.jp` (not live yet)

As of 2026-09-26 the domain has **no public DNS zone** (NXDOMAIN). Once registered, point it at Codeberg Pages and authorize this repo:

| Name | Type | Value |
|------|------|-------|
| `@` | A | `217.197.84.141` |
| `@` | AAAA | `2a0a:4580:103f:c0de::2` |
| `_git-pages-repository.digitalcommons.jp` | TXT | `https://codeberg.org/digico/digitalcommons.jp.git` |

Then redeploy (push to `pages`) and switch the webhook URL to `https://digitalcommons.jp/` after the first successful HTTPS deploy.

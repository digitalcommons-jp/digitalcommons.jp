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

Custom domain `digitalcommons.jp` points at Codeberg Pages (`217.197.84.141`).
Authorization TXT record (webhook deploy):

| Name | Type | Value |
|------|------|-------|
| `_git-pages-repository.digitalcommons.jp` | TXT | `https://codeberg.org/digico/digitalcommons.jp.git` |

Webhook target (Forgejo): `http://digitalcommons.jp/` (first deploy), then `https://digitalcommons.jp/`.
Branch filter: `pages`.

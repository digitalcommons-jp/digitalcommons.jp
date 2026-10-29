# digitalcommons.jp

The website of Digital Commons Japan. Built with Astro and plain CSS (no Tailwind; it started from the AstroWind template). Production runs on the VPS "v2"; a mirror runs on Codeberg Pages.

## Development

```sh
pnpm install
pnpm dev      # localhost:4321
pnpm build    # static output into dist/
```

Node.js >= 22.22.3

## Public URLs

|        | URL                                             |
| ------ | ----------------------------------------------- |
| Production | https://digitalcommons.jp/                  |
| Mirror | https://digico.codeberg.page/digitalcommons.jp/ |
| CMS    | a secret path (see "Sveltia CMS" below)         |

## Deployment

### Production (VPS "v2")

**The build happens locally; only `dist/` is sent to v2. Nothing is built on the server.**

```sh
scripts/deploy.sh --dry-run   # only show what would change
scripts/deploy.sh             # build and rsync to /opt/dc/dist
```

- Site files: `/opt/dc/dist` (served by Caddy).
- **The source of truth for the Caddyfile is `~/dev/v2/Caddyfile`** (identical to `/etc/caddy/Caddyfile` on v2). Several projects on v2 share one Caddyfile, so this repository does not carry it. To change the `digitalcommons.jp` block, edit `~/dev/v2/Caddyfile` and distribute it with `~/did.md/deploy.sh client`.
- **The identity documents (`.well-known/did.json`, `did.jsonl`, `did-witness.json`) live apart from the site**: `/var/lib/dc-host/root/.well-known/`. `dc-host.service` (`byo-host`, `127.0.0.1:8796`) is the only writer; Caddy only serves them read-only. Writes (`PUT/POST/DELETE/OPTIONS`) are forwarded to byo-host.
- So redeploying the site never overwrites or deletes the identity files (`scripts/deploy.sh` also `--exclude`s them to be safe).
- `public/.well-known/` in the repository holds only `atproto-did` (a fixed string). Identity documents are not managed in the repository.
- **Publishing to and withdrawing from standard.site**: `SEQUOIA=1 scripts/deploy.sh` publishes posts with `social: true`. Sequoia never deletes, so when a post is removed, set to draft, or set to `social: false`, `scripts/sequoia-prune.mjs` removes the `site.standard.document` on the PDS (by default it only lists them; to actually delete, run `PRUNE=1 SEQUOIA=1 scripts/deploy.sh`). It never deletes anything other than `site.standard.document` records in its own repository.

### Path routing (investigation of conflicts with GoToSocial)

Result of checking a running GoToSocial (gts.superseriousbusiness.org) on 2026-10-01.

| Path                                                                                  | GoToSocial                                | Routed to                                      |
| ------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------- |
| `/.well-known/webfinger` `host-meta` `nodeinfo`, `/nodeinfo/*`                        | yes                                       | GoToSocial                                     |
| `/@*` `/users/*` `/api/*` `/oauth/*` `/auth/*` `/fileserver/*` `/settings/*` `/login` | yes                                       | GoToSocial                                     |
| **`/about`**                                                                          | **yes (conflict)**                        | **Astro** (not in the allowlist)               |
| **`/admin`**                                                                          | redirects to `/settings/admin` (conflict) | **Astro** (CMS entry; not in the allowlist)    |
| **`/tags/<x>`**                                                                       | **yes (conflict)**                        | **Astro** (see the note below)                 |
| `/robots.txt`                                                                         | yes                                       | Astro (outside the allowlist)                  |
| `/.well-known/site.standard.publication`                                              | no                                        | Astro                                          |
| `/join` `/actions` `/privacy` `/feed.xml` `/posts/*`                                  | no                                        | Astro                                          |

**Note**: hashtag links in GoToSocial posts have the form `https://digitalcommons.jp/tags/<name>`. These land on the Astro tag page (`/tags/<tag>`). If there is no such tag, the result is a 404. If that bothers you, move the site's tag pages to another path (e.g. `/topics/`).

### Mirror (Codeberg Pages)

**Codeberg Actions** (`.forgejo/workflows/deploy.yml`) runs `pnpm install --frozen-lockfile && pnpm build` on every push to main and publishes `dist/` with the [git-pages action](https://codeberg.org/git-pages/action).

Manually:

```sh
pnpm build
# push the contents of dist/ to the pages branch
```

## Sveltia CMS

- Location: not `/` but an unguessable secret path. `CMS_PATH` in `.env` (never committed; generate with `openssl rand -hex 12`). It is used only at build time, and builds without `CMS_PATH` do not include the CMS. **Build the CMS-enabled site locally, where `.env` is.**
- Config: `src/cms/config.yml`
- Backend: Codeberg `digico/digitalcommons.jp`
- Login: Codeberg OAuth (`app_id` is set; the redirect URI is also this secret path) or an access token
- Posts: `src/content/posts/*.md`

## Customization

- Site settings: `astro.config.ts` (`site`) and `src/content/settings/site.yml`
- Top page: `src/pages/index.astro`
- Editing the front end (HTML / CSS): see "Manual for admins" below

## DNS for the mirror (when switching to Codeberg Pages)

| Name                                      | Type | Value                                               |
| ----------------------------------------- | ---- | --------------------------------------------------- |
| `@`                                       | A    | `217.197.84.141`                                    |
| `@`                                       | AAAA | `2a0a:4580:103f:c0de::2`                            |
| `_git-pages-repository.digitalcommons.jp` | TXT  | `https://codeberg.org/digico/digitalcommons.jp.git` |

When serving from the apex, leave `base` at `/` (the default).

---

# Manual for admins: editing HTML / CSS

## 0. Basic flow

```sh
pnpm install        # first time only
pnpm dev        # edit while checking at http://localhost:4321/ (changes apply on save)
pnpm check      # type-check before submitting
pnpm build      # production build (dist/). Make sure it reports no errors
```

Edit → check in the browser → `pnpm check` → commit / push. Pushing triggers an automatic deployment by Codeberg Actions.

## 1. Where things are

| What you want to change                          | File to touch                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Looks (color, spacing, size, layout)             | `src/assets/styles/style.css` (**almost everything is here**)                         |
| Colors (palette)                                 | top of `src/assets/styles/style.css` (`--primary` etc.)                               |
| Breakpoint                                       | `@custom-media` at the top of `style.css`                                             |
| Frame shared by all pages (`<head>`, header, footer) | `src/components/frame/Layout.astro`                                               |
| Header / footer / logo                           | `src/components/frame/` (`01_header` `03_main` `05_footer`), `shared/Logo*.astro`     |
| HTML of each section on the top page             | `src/components/00_home/*.astro` (01_hero … 09_join-cta)                              |
| Row order / show-hide on the top page            | `src/pages/index.astro` (parts are stacked top to bottom)                             |
| One row of events / projects                     | `src/components/shared/ItemRow.astro`                                                 |
| Body of fixed pages (about, join, …)             | `src/content/pages/*.md` (Markdown)                                                   |
| Blog posts                                       | `src/content/posts/*.md`                                                              |
| Site name, email, tagline                        | `src/content/settings/site.yml`                                                       |
| UI strings such as navigation                    | `src/i18n/ja.ts`                                                                      |
| Font settings                                    | `fonts` in `astro.config.ts`                                                          |
| Images                                           | `src/assets/images/`                                                                  |
| favicon and files served as-is                   | `public/`                                                                             |

In an `.astro` file, "the part between the `---` lines at the top is processing (TypeScript); the rest is HTML". The HTML part can be written like ordinary HTML.

## 2. Changing the look (CSS)

### Steps

1. Select the element in the browser DevTools and note its `class` (e.g. `hero-title`).
2. Search for that class in `style.css`.
3. Change the value and save. The browser reflects it immediately.

`style.css` is divided into sections by heading comments (Reset / Logo / Header / Hero / Buttons / Navigation / Sections・Grids / Post card / Join band・Footer / Prose). Find the relevant section first.

### Colors and fonts

Change the palette at the top of `style.css`. The main color is `--primary` (buttons, links, labels, the hero illustration); changing it changes the color of the whole site. Light surfaces and the selection color are opacity variants of `--primary` (`--primary-muted`, `-light`, `-soft`, `-faint`) and follow along. The second color is `--secondary` (currently peach; its light variant `--secondary-soft` is the page background) and `--accent` (a darkened peach for emphasis: small labels, card icons, event days in the calendar). The third color is `--tertiary` (currently the butter-yellow marker on headings and the logo). Each has the same opacity variants.

```css
--primary: var(--teal); /* the original color is --teal (#1d9c81) */
--secondary: var(--peach);
--tertiary: var(--yellow);
```

The font is Fira Sans (self-hosted via `astro.config.ts`). Japanese falls back to the system's Japanese sans-serif.

### Breakpoint (width at which mobile / tablet / desktop switch)

It is defined in exactly one place at the top of `style.css`. **To change the width, change it only here.**

```css
@custom-media --bp-md (min-width: 42rem); /* 672px */
```

Use it as `@media (--bp-md) { ... }` ("672px and up"). Write mobile styles first and override them on wide screens (mobile-first). **Do not write `@media (min-width: 42rem)` directly.**
CSS variables (`var(--x)`) cannot be used inside `@media` conditions by spec, which is why `@custom-media` is used.

## 3. CSS rules of this site (CCD)

Details are in the "CCD" section of [ARC.md](./ARC.md). The design aligns dimensions to integer multiples of the character cell. What to follow in practice:

- **Use `rem` only. Never write `px`.** (672px is `42rem`.)
- Horizontal dimensions are `calc(N * var(--cc-w))`. `--cc-w` is the width of one character = `0.5rem` (one full-width character = 2 cells).
- Vertical dimensions are integer `rem`. As the single exception, `padding-block: 0.5rem` may be used, symmetrically top and bottom.
- Draw borders with `box-shadow: inset 0 0 0 1px ...`, not `border` (to keep the box size from changing).
- Text is left-aligned.

When in doubt, imitate an existing class (`.btn`, `.container-cc`, `.section`, …).

## 4. Changing the HTML

- Page parts go in `src/components/NN_<page>/` (structure in `ARC.md`). File-name numbers are the display order, top to bottom.
- Sections on the top page: edit the matching file in `src/components/00_home/`.
- Shared frame, header, footer: `components/frame/Layout.astro` / `01_header.astro` / `05_footer.astro`.
- Prefer keys in `src/i18n/ja.ts` (`t('nav.join')`) to hard-coding strings in `.astro` files.
- Import images and show them with `<Image>` (they get optimized). See `00_home/01_hero.astro` for an example.
- When you add a new class, write the matching style in `style.css`.

### Reordering, hiding, and adding rows on the top page

The parts are listed top to bottom in `src/pages/index.astro`. Reorder, comment out, or add rows by editing that file. Create a new row as an odd-numbered `.astro` in `src/components/00_home/` (the outermost element is `<section class="row">`: width 100%, margin 0). Only if the content should fit the body width, put a `<div class="container-cc">` inside.

### New fixed pages

Add a Markdown file under `src/content/pages/`; `[slug].astro` renders it. Body styling is the "Prose" section of `style.css`.

## 5. What to check

- Check at different widths (responsive mode in DevTools, around 672px).
- That the Japanese body text is not broken.
- That `pnpm check` and `pnpm build` pass.
- That `pnpm dev` is not already running. If port 4321 is in use, it cannot start.

## 6. Cautions

- `style.css` does not use PostCSS / Tailwind. `@apply` and Tailwind classes (such as `md:flex`) do not work.
- Posts can also be added and edited from the CMS (see "Sveltia CMS" above). Only HTML / CSS changes need code editing.

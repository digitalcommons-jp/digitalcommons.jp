# ARC — architecture and developer guide

File layout and naming rules for `src/`, the CCD dimension rules, deployment, and the editing manual. Update this file whenever the structure changes.

## Naming rules

- **Page parts live in one folder per page**: `src/components/NN_<page>/`. Folder numbers run sequentially from `00`.
- **File-name numbers are odd only** (`01_` `03_` `05_` …). The visual order of the page, top to bottom, is reflected directly in the file names.
- **Even numbers are reserved**: free slots for inserting exceptional parts later. Normally unused.
- Parts that belong to no page go in unnumbered folders (`head/` `frame/` `shared/`).
- Routing stays in `src/pages/` because of an Astro constraint. `pages/*.astro` are thin files that only arrange `Layout` + parts.

## Overview

```
src/
├── assets/            static assets (processed by Vite)
│   ├── favicons/        favicon.ico / favicon.svg / apple-touch-icon.png
│   ├── images/          nez-trace.svg (hero illustration, traced from a purchased PIXTA asset; the original nez.png / nez.jpg are not in git)
│   └── styles/style.css all styles (palette, tokens, component classes)
├── cms/               Sveltia CMS (served at the secret path CMS_PATH)
│   ├── admin.astro      admin page (injected as a route by astro.config.ts)
│   ├── config.yml       CMS definition (collections, fields)
│   └── config.yml.ts    endpoint that returns config.yml via ?raw
├── components/        → see below
├── content/           content (collections of content.config.ts)
│   ├── pages/           fixed pages (about / join / contact / privacy)
│   ├── posts/           posts (including event posts)
│   ├── projects/        projects (long-term efforts and deliverables)
│   └── settings/        site.yml (site name, description, contact)
├── i18n/ja.ts         UI strings (key → Japanese)
├── i18n/index.ts      t() and formatDate()
├── lib/
│   ├── content.ts       getPosts / getEvents / getTags / getSetting …
│   ├── calendar.ts      jstParts / monthGrid (for the event calendar)
│   ├── nav.ts           main menu definition (shared by header and footer)
│   └── markdown.ts      rehype plugin (makes tables horizontally scrollable; loaded from astro.config.ts)
├── pages/             routing only
├── content.config.ts  collection schemas
├── env.d.ts           type references
└── types.d.ts         `~/types` (MetaData)
```

## components/

```
components/
├── head/              invisible parts inside <head> (used by Layout)
│   ├── CommonMeta.astro
│   ├── Favicons.astro
│   └── Metadata.astro
├── frame/             frame shared by all pages. Layout assembles <head> and the three parts below
│   ├── Layout.astro       template wrapping every page (unnumbered)
│   ├── 01_header.astro
│   ├── 03_main.astro      <main><slot/></main>
│   └── 05_footer.astro
├── shared/            parts reused across pages
│   ├── PageHero.astro     first row of list pages (title)
│   ├── ItemRow.astro      one row for an event / project / post (header + heading + description; the header is ItemHead)
│   ├── Donate.astro       "Support our activities" (right column of the about / join cards; copy comes from `donation` in about.md)
│   ├── ItemHead.astro     one-line header of a project / event card (icon for the kind + status: recruiting members / in progress / done / date held)
│   └── LogoBlock.astro    header logo (two lines: digital / commons)
│
├── 00_home/           pages/index.astro (rows stacked top to bottom; each part's outermost element is a full-width `<section class="row">`)
│   ├── 01_hero.astro
│   ├── 03_event.astro
│   └── 05_project.astro
├── 02_post/           pages/posts/[slug].astro
│   ├── 01_header.astro    date, tags, title
│   ├── 03_event-details.astro  shown for event posts only
│   └── 05_body.astro      Markdown body
├── 03_tag/            pages/tags/[tag].astro
│   ├── 01_hero.astro
│   └── 03_list.astro
├── 04_page/           pages/[slug].astro (shared by Markdown fixed pages such as privacy; the hero is also used by about / join / contact)
│   ├── 01_hero.astro      title + lead text. If the frontmatter has image / art, a figure is shown on the right (position: artPosition, text wrap: artWrap; an uploaded image, or DiceBear Shapes generated from a seed)
│   └── 03_article.astro   Markdown body
├── 05_not-found/      pages/404.astro
│   └── 01_message.astro
├── 06_actions/        pages/actions.astro (projects are the parents; upcoming events follow as cards)
│   ├── 01_hero.astro      one featured project
│   ├── 03_list.astro      remaining projects
│   ├── 05_events.astro    upcoming events (cards, soonest first)
│   └── 07_event_navigation.astro  link to past events + calendar of the current month (rigid_card)
├── 07_past-events/    pages/events/past.astro
│   ├── 01_hero.astro
│   └── 03_list.astro
├── 08_about/          pages/about.astro
│   ├── 03_about.astro     mission + approaches (full width, no background)
│   ├── 05_members.astro   members (two columns on desktop. Each member: avatar / name, with the language label and SNS to its right, and a PGP key band below. No background)
│   └── 07_overview.astro  organization overview (card)
├── 09_contact/        pages/contact.astro (consultation: hero + Markdown body (04_page/03_article) + consultation form)
└── 10_join/           pages/join.astro (the hero is 04_page/01_hero)
    ├── 03_guide.astro     the whole Markdown body (a section per `##`, keyword labels, forms, `<div class="card">` cards. Full width, no background)
    └── 05_follow.astro    card with Follow (left; content is `follow` in join.md) + Support our activities (right; shared/Donate)
```

### Section kinds (terminology)

- **fluid_section** (`.fluid-section`): a section whose layout changes with the screen width. On mobile (under 672px) it is full-width (margin 0, no rounded corners); on desktop (672px and up) it is a card (margin 1rem, radius 1rem). It does not change on scroll (the former scroll-dependent switching was removed). The rows in `shared/ItemRow.astro` are this kind.
- **rigid_section**: a section whose layout does not move.
  - **rigid_card** (`.rigid-card`): always a card (margin 1rem, radius 1rem, regardless of width). `06_actions/07_event_navigation.astro` is this kind.
  - hero / page-hero are always full-width and do not move.

### Pages and routes

| URL                | route                      | parts                                         |
| ------------------ | -------------------------- | --------------------------------------------- |
| `/`                | `pages/index.astro`        | `00_home/*`                                   |
| `/actions`         | `pages/actions.astro`      | `06_actions/*`                                |
| `/posts/<id>`      | `pages/posts/[slug].astro` | `02_post/*`                                   |
| `/tags/<tag>`      | `pages/tags/[tag].astro`   | `03_tag/*`                                    |
| `/privacy`         | `pages/[slug].astro`       | `04_page/*` (body is `content/pages/*.md`)    |
| `/join`            | `pages/join.astro`         | `04_page/01_hero` + `10_join/*` (sections come from the body of `content/pages/join.md`; forms are written as HTML in the body; the cards below use `follow` (frontmatter) + `shared/Donate`) |
| `/about`           | `pages/about.astro`        | `08_about/*` (content is the frontmatter of `content/pages/about.md`) |
| `/events/past`     | `pages/events/past.astro`  | `07_past-events/*`                            |
| 404                | `pages/404.astro`          | `05_not-found/*`                              |
| `/feed.xml`        | `pages/feed.xml.ts`        | none (RSS)                                    |

---

## CCD — Character-Cell Design (dimension rules)

### Overview

Implementation spec for realizing the principles of CCD (Character-Cell Design) in the browser.

### 1. Base unit

The cell width is determined by `1ch` of the reference monospace font **Fira Code** (Google Fonts, bundled with the site via Astro's font feature). The characters actually displayed can stay in a proportional font (Fira Sans). The monospace font is used only as the ruler for cell dimensions.

```css
@property --cc-w {
  syntax: '<length>';
  inherits: true;
  initial-value: 9.6px;
}

:root {
  font-family: var(--font-fira-code), monospace;
  --cc-w: 1ch; /* Fira Code: 0.6em × 16px = 9.6px */
}

body {
  font-family: var(--font-fira), ...; /* displayed font (proportional) */
  line-height: 2rem; /* 2rem is required for Japanese */
}
```

Registering `--cc-w` as a length with `@property` makes the value computed on `:root` (monospace font) inherit as a fixed px value into children that use another font. This gives "proportional font for display, monospace font for cells" without JS. Fira Code is bundled with the site, so `--cc-w` has the same value (9.6px) on every device.

Everything horizontal is an integer multiple of `var(--cc-w)`; everything vertical is an integer multiple of `rem`.

#### Why `rem` instead of `1lh`

`lh` refers to the element's own line-height. Applying `margin: 1lh` to an h1 with `font-size: 4rem` gives `4rem`. Use `1rem` for one body-based cell.

### 2. Grid snapping (JS) — not implemented

> Not implemented at the moment. Fira Code is bundled and `--cc-w` is fixed across devices, so it is not required. Introduce it if the remainder left by screen widths that are not integer multiples of the cell width becomes a concern.

`1ch` can be a non-integer px value depending on font and environment. CSS `auto` / `fr` compute in px space, so errors accumulate. Snapping in JS resolves this.

#### Flow

```
1. Measure the px value of 1ch with a ruler element
2. Update --cc-w to that value (CSS recomputes)
3. Reset the inline width of every element
4. Measure the layout after the new --cc-w with requestAnimationFrame
5. Snap the width of every block to an integer multiple of chPx
6. Adjust paddingBlockEnd to snap the bottom edge to an integer multiple of remPx
7. Center the container consistently with chPx
8. Compute and set the grid column widths explicitly
```

#### Grid column calculation

```js
// equal split (data-cols="N")
const colPx = Math.floor((elW - gapsPx) / cols / chPx) * chPx;

// fixed left (data-left-cols="N")
const rightPx = Math.floor((innerPx - leftPx - gapPx) / chPx) * chPx;
```

#### Block-end snapping

```js
const remainder = blockHeight % remPx;
if (remainder > 0.01) {
  el.style.paddingBlockEnd = remPx - remainder + 'px';
}
```

Aligning the block end to the rem grid guarantees where the next block starts.

#### Performance

- Initial: once on load
- Resize: after a 100ms debounce
- Scroll: not registered

### 3. Typography

#### Choosing line-height

Choose line-height for readability first. The JS guarantees block-end alignment.

```
TUI-oriented monospace (low x-height)   → line-height: 1rem works
Code-oriented monospace (high x-height) → line-height: 2rem recommended
proportional serif/sans                 → line-height: 2rem or more
CJK                                     → line-height: 2rem required
```

Start from `1rem` and pick the smallest integer rem that looks right.

#### Definition of cell occupancy

"Occupying a cell" = alignment of line-box boundaries, not of glyphs (ink). Ink overflow is not a layout violation.

### 4. Spacing

Horizontal: `calc(N * var(--cc-w))`
Vertical: `calc(N * 1rem)`

#### The 0.5rem exception

Vertical only. Use it symmetrically so the total is a whole number of cells.

```css
padding-block: 0.5rem; /* ✓ total 1rem */
padding-block-start: 0.5rem; /* ✗ asymmetric */
```

Background: `1lh > 1ch` (monospace fonts are tall). Integer-rem vertical padding looks visually too large, so 0.5rem lets it be tightened symmetrically.

### 5. Borders

`border` affects the box model and breaks cell sizes. Use `box-shadow: inset`.

```css
box-shadow: inset 0 0 0 1px currentColor;
```

### 6. Layout

#### Container

```css
.container {
  width: calc(80 * var(--cc-w));
  max-width: 100%;
  padding-inline: calc(4 * var(--cc-w));
}
```

#### Columns

```css
/* JS sets gridTemplateColumns explicitly */
[data-cols="N"]      /* N equal columns */
[data-left-cols="N"] /* fixed N columns on the left + auto on the right */
```

Gutter widths are also specified in cells.

### 7. Font model

#### Reference font

One monospace font defines the physical px of `1ch`. Fonts designed for TUIs (ink fits within the em-square) suit CCD best.

```
Terminus, Fixedsys, Perfect DOS VGA, Unistra A
```

Code-oriented fonts (JetBrains Mono, Cascadia Code, etc.) have a high x-height and tend to look cramped at `line-height: 1rem`.

#### Alignment with CJK

When the reference font has `1ch = 0.5em`, CJK characters (1em) naturally align to 2 cells. This condition depends on the font.

```
ui-monospace (SF Mono): 1ch = 0.5em → CJK = 2 cells ✓
Menlo etc.:             1ch ≠ 0.5em → CJK may drift
```

### 8. Components

#### Button

```css
.btn {
  height: calc(2 * 1rem);
  min-width: calc(8 * var(--cc-w));
  padding-inline: calc(2 * var(--cc-w));
  padding-block: 0.5rem;
  box-shadow: inset 0 0 0 1px currentColor;
}
```

#### Input

```css
.input {
  height: calc(2 * 1rem);
  width: calc(20 * var(--cc-w));
  padding-inline: calc(1 * var(--cc-w));
  padding-block: 0.5rem;
  box-shadow: inset 0 0 0 1px currentColor;
}
```

### 9. Rules

#### No fractional cells

Fractional cells do not exist. Fractional multiples such as 0.5, 1.5, 2.75 are forbidden.

Exception: 0.5 cell is allowed vertically only, used symmetrically so the total is a whole number of cells.

#### Text alignment

```
left    — recommended
right   — allowed (numbers, labels, etc.)
center  — allowed (formerly discouraged; the half-cell drift for odd character counts is accepted)
justify — forbidden (varying letter spacing breaks the grid)
```

#### Responsive

Responsiveness is achieved by redistributing cell counts. The font size (`font-size`) of displayed text may vary with screen width (formerly forbidden; e.g. `clamp()` for the hero heading). Line height (`line-height`), however, is rounded to an integer rem (e.g. `round(up, 1.2em, 1rem)`). Margins and widths remain integer multiples of cells (horizontal) and rem (vertical).

---

# Development and operations

## Development

```sh
pnpm install
pnpm dev      # localhost:4321
pnpm build    # static output into dist/
```

Node.js >= 26.13.0

## Deployment

The site is hosted on **GitHub Pages**. Pushing to `main` runs `.github/workflows/pages.yml`, which builds with `pnpm build` (Node 26, `pnpm install --frozen-lockfile`) and publishes `dist/`. Nothing else needs to be done.

- Custom domain: `digitalcommons.jp`, set in the repository's Pages settings. DNS is managed in Cloudflare: four `A` and four `AAAA` records on the apex pointing at GitHub Pages (`185.199.108.153`–`185.199.111.153`, `2606:50c0:8000::153`–`8003::153`), in "DNS only" mode.
- `pnpm-lock.yaml` and `pnpm-workspace.yaml` are tracked: CI installs with `--frozen-lockfile`, so update the lockfile whenever dependencies change.
- `public/` is copied to the site root as-is. GitHub Pages ignores `_headers`, so custom response headers are not available.

### Identity documents

`public/.well-known/` holds the files that identify the domain:

- `did.json` and `did.jsonl` (did:web / did:webvh documents; public data only)
- `atproto-did` (AT Protocol handle verification)
- `site.standard.publication` (standard.site publication record)

GitHub Pages serves static files only, so updating an identity document means committing the new file and letting the workflow deploy it. Pages sends `application/json` for `did.json` and `application/octet-stream` for the extension-less or `.jsonl` files; Pages adds `Access-Control-Allow-Origin: *` by itself.

### Links from GoToSocial

Hashtag links in GoToSocial posts have the form `https://digitalcommons.jp/tags/<name>` and land on the Astro tag page (`/tags/<tag>`). If there is no such tag, the result is a 404.

## Sveltia CMS

- Location: not `/` but an unguessable secret path. `CMS_PATH` in `.env` (never committed; generate with `openssl rand -hex 12`). It is used only at build time, and builds without `CMS_PATH` do not include the CMS. The deployed site gets the same path from the `CMS_PATH` repository secret (see `.github/workflows/pages.yml`); locally it comes from `.env`.
- Config: `src/cms/config.yml`
- Backend: GitHub `digitalcommons-jp/digitalcommons.jp` (branch `main`). Sign in with a personal access token that has write access to the repository; saving a post commits to `main`, which triggers the Pages deployment.
- Posts: `src/content/posts/*.md`

## Customization

- Site settings: `astro.config.ts` (`site`) and `src/content/settings/site.yml`
- Top page: `src/pages/index.astro`
- Editing the front end (HTML / CSS): see "Manual for admins" below

---

## Manual for admins: editing HTML / CSS

### 0. Basic flow

```sh
pnpm install        # first time only
pnpm dev        # edit while checking at http://localhost:4321/ (changes apply on save)
pnpm check      # type-check before submitting
pnpm build      # production build (dist/). Make sure it reports no errors
```

Edit → check in the browser → `pnpm check` → commit / push.

### 1. Where things are

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

### 2. Changing the look (CSS)

#### Steps

1. Select the element in the browser DevTools and note its `class` (e.g. `hero-title`).
2. Search for that class in `style.css`.
3. Change the value and save. The browser reflects it immediately.

`style.css` is divided into sections by heading comments (Reset / Logo / Header / Hero / Buttons / Navigation / Sections・Grids / Post card / Join band・Footer / Prose). Find the relevant section first.

#### Colors and fonts

Change the palette at the top of `style.css`. The main color is `--primary` (buttons, links, labels, the hero illustration); changing it changes the color of the whole site. Light surfaces and the selection color are opacity variants of `--primary` (`--primary-muted`, `-light`, `-soft`, `-faint`) and follow along. The second color is `--secondary` (currently peach; its light variant `--secondary-soft` is the page background) and `--accent` (a darkened peach for emphasis: small labels, card icons, event days in the calendar). The third color is `--tertiary` (currently the butter-yellow marker on headings and the logo). Each has the same opacity variants.

```css
--primary: var(--teal); /* the original color is --teal (#1d9c81) */
--secondary: var(--peach);
--tertiary: var(--yellow);
```

The font is Fira Sans (self-hosted via `astro.config.ts`). Japanese falls back to the system's Japanese sans-serif.

#### Breakpoint (width at which mobile / tablet / desktop switch)

It is defined in exactly one place at the top of `style.css`. **To change the width, change it only here.**

```css
@custom-media --bp-md (min-width: 42rem); /* 672px */
```

Use it as `@media (--bp-md) { ... }` ("672px and up"). Write mobile styles first and override them on wide screens (mobile-first). **Do not write `@media (min-width: 42rem)` directly.**
CSS variables (`var(--x)`) cannot be used inside `@media` conditions by spec, which is why `@custom-media` is used.

### 3. CSS rules of this site (CCD)

Details are in the CCD section above. The design aligns dimensions to integer multiples of the character cell. What to follow in practice:

- **Use `rem` only. Never write `px`.** (672px is `42rem`.)
- Horizontal dimensions are `calc(N * var(--cc-w))`. `--cc-w` is the width of one character = `0.5rem` (one full-width character = 2 cells).
- Vertical dimensions are integer `rem`. As the single exception, `padding-block: 0.5rem` may be used, symmetrically top and bottom.
- Draw borders with `box-shadow: inset 0 0 0 1px ...`, not `border` (to keep the box size from changing).
- Text is left-aligned.

When in doubt, imitate an existing class (`.btn`, `.container-cc`, `.section`, …).

### 4. Changing the HTML

- Page parts go in `src/components/NN_<page>/` (structure above). File-name numbers are the display order, top to bottom.
- Sections on the top page: edit the matching file in `src/components/00_home/`.
- Shared frame, header, footer: `components/frame/Layout.astro` / `01_header.astro` / `05_footer.astro`.
- Prefer keys in `src/i18n/ja.ts` (`t('nav.join')`) to hard-coding strings in `.astro` files.
- Import images and show them with `<Image>` (they get optimized). See `00_home/01_hero.astro` for an example.
- When you add a new class, write the matching style in `style.css`.

#### Reordering, hiding, and adding rows on the top page

The parts are listed top to bottom in `src/pages/index.astro`. Reorder, comment out, or add rows by editing that file. Create a new row as an odd-numbered `.astro` in `src/components/00_home/` (the outermost element is `<section class="row">`: width 100%, margin 0). Only if the content should fit the body width, put a `<div class="container-cc">` inside.

#### New fixed pages

Add a Markdown file under `src/content/pages/`; `[slug].astro` renders it. Body styling is the "Prose" section of `style.css`.

### 5. What to check

- Check at different widths (responsive mode in DevTools, around 672px).
- That the Japanese body text is not broken.
- That `pnpm check` and `pnpm build` pass.
- That `pnpm dev` is not already running. If port 4321 is in use, it cannot start.

### 6. Cautions

- `style.css` does not use PostCSS / Tailwind. `@apply` and Tailwind classes (such as `md:flex`) do not work.
- Posts can also be added and edited from the CMS (see "Sveltia CMS" above). Only HTML / CSS changes need code editing.

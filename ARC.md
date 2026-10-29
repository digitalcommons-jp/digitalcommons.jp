# ARC — structure of src/

File layout and naming rules for `src/`. Update this file whenever the structure changes.

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

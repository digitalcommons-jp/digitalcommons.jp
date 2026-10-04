# ARC — src/ の構成

`src/` のファイル配置と命名規則。構成を変えたらここも更新する。

## 命名規則

- **ページ部品はページごとのフォルダに置く**: `src/components/NN_<page>/`。フォルダ番号は `00` から連番。
- **ファイル名の番号は奇数のみ**（`01_` `03_` `05_` …）。ページ上から下への視覚的な並び順をそのままファイル名に反映する。
- **偶数は予約**: 後から例外的な部品を差し込むための空き番号。通常は使わない。
- ページに属さない部品は番号なしのフォルダ（`head/` `frame/` `shared/`）。
- ルーティングは Astro の制約で `src/pages/` に残す。`pages/*.astro` は `Layout` + 部品を並べるだけの薄いファイル。

## 全体

```
src/
├── assets/            静的アセット（Vite が処理）
│   ├── favicons/        favicon.ico / favicon.svg / apple-touch-icon.png
│   ├── icons/           astro-icon 用（README のみ・空）
│   ├── images/          default.png / hero-placeholder.svg
│   └── styles/style.css 全スタイル（パレット・トークン・コンポーネント class）
├── cms/               Sveltia CMS（/admin）
│   ├── admin.astro      管理画面ページ（astro.config.ts の injectRoute で配信）
│   ├── config.yml       CMS 定義（コレクション・フィールド）
│   └── config.yml.ts    config.yml を ?raw で返すエンドポイント
├── components/        → 下記
├── content/           コンテンツ（content.config.ts のコレクション）
│   ├── pages/ja/        固定ページ（about / follow / join / privacy / disclosure）
│   ├── posts/           記事（イベント記事含む）
│   └── settings/        home.yml（トップの並び）/ site.yml（サイト名等）
├── i18n/              UI 文言（ja.ts が正、en.ts は同キー）と useT / localePath / formatDate
├── lib/               ロジック（UI なし）
│   ├── content.ts       getPosts / getEvents / getTags / getSetting …
│   ├── permalinks.ts    getCanonical / getAsset（`astrowind:config` の SITE を参照）
│   └── markdown.ts      rehype プラグイン（表を横スクロール可能にする。astro.config.ts から読込）
├── pages/ja/        固定ページ（about / follow / join / privacy / disclosure）
│   ├── posts/           記事（イベント記事含む）
│   └── settings/        home.yml（トップの並び）/ site.yml（サイト名等）
├── i18n/              UI 文言（ja.ts が正、en.ts は同キー）と useT / localePath / formatDate
├── lib/               ロジック（UI なし）
│   ├── content.ts       getPosts / getEvents / getTags / getSetting …
│   ├── permalinks.ts    getCanonical / getAsset
│   ├── utils.ts         trim 等
│   └── frontmatter.ts   remark/rehype プラグイン（astro.config.ts から読込）
├── pages/             ルーティングのみ
├── config.yaml        サイト設定（vendor/integration が仮想モジュール `astrowind:config` として供給）
├── content.config.ts  コレクション schema
├── env.d.ts           型参照
└── types.d.ts         `~/types`（MetaData 等）
```

## components/

```
components/
├── head/              <head> 内の非表示部品（Layout が使用）
│   ├── CommonMeta.astro
│   ├── CustomStyles.astro
│   ├── Favicons.astro
│   └── Metadata.astro
├── frame/             全ページ共通の枠。Layout が <head> と下の 3 つを組み立てる
│   ├── Layout.astro       全ページを包むテンプレート（番号なし）
│   ├── 01_header.astro
│   ├── 03_main.astro      <main><slot/></main>
│   └── 05_footer.astro
├── shared/            ページ横断で再利用する部品
│   ├── PostCard.astro
│   ├── LogoHorizon.astro  ヘッダが使用
│   └── LogoBlock.astro    ※未使用（下記）
│
├── 00_home/           pages/index.astro（セクション順は content/settings/home.yml が決定。番号は既定の並び）
│   ├── 01_hero.astro
│   ├── 03_pickup.astro
│   ├── 05_intro.astro
│   ├── 07_upcoming-event.astro
│   ├── 09_latest-posts.astro
│   ├── 11_join-cta.astro
│   └── custom/            home.yml の `type: custom` 用の自由枠
│       ├── ExampleBlock.astro
│       └── index.ts       customComponents 登録表
├── 01_events/         pages/events.astro
│   ├── 01_upcoming.astro
│   └── 03_past.astro
├── 02_post/           pages/posts/[slug].astro
│   ├── 01_header.astro    日付・タグ・タイトル
│   ├── 03_event-details.astro  イベント記事のみ表示
│   └── 05_body.astro      Markdown 本文
├── 03_tag/            pages/tags/[tag].astro
│   └── 01_list.astro
├── 04_page/           pages/[slug].astro（about / join / follow / privacy / disclosure など Markdown 固定ページ共通）
│   └── 01_article.astro
└── 05_not-found/      pages/404.astro
    └── 01_message.astro
```

### ページとルートの対応

| URL                                                 | route                      | 部品                                          |
| --------------------------------------------------- | -------------------------- | --------------------------------------------- |
| `/`                                                 | `pages/index.astro`        | `00_home/*`                                   |
| `/events`                                           | `pages/events.astro`       | `01_events/*`                                 |
| `/posts/<id>`                                       | `pages/posts/[slug].astro` | `02_post/*`                                   |
| `/tags/<tag>`                                       | `pages/tags/[tag].astro`   | `03_tag/*`                                    |
| `/about` `/join` `/follow` `/privacy` `/disclosure` | `pages/[slug].astro`       | `04_page/*`（本文は `content/pages/ja/*.md`） |
| 404                                                 | `pages/404.astro`          | `05_not-found/*`                              |
| `/feed.xml`                                         | `pages/feed.xml.ts`        | なし（RSS）                                   |

## 要確認（未対応・削除はしていない）

- `components/shared/LogoBlock.astro`: どこからも import されていない。
- `components/head/Metadata.astro` / `lib/permalinks.ts` は `vendor/integration`（AstroWind 由来）の仮想モジュール `astrowind:config` に依存している。
- 未使用の依存の可能性: `limax` `reading-time` `mdast-util-to-string`（`src/` からの参照がなくなった）。`package.json` は未変更。
- `src/types.d.ts` は AstroWind のウィジェット型が大半（実際に使うのは `MetaData` 系のみ）。
- `eslint.config.js` に存在しない `src/components/common/Analytics.astro` 用の例外がある。`astro.config.ts` のコメントも存在しない `common/Image.astro` に言及。
- `AGENTS.md` の Directory Structure は AstroWind テンプレートのまま（実態と不一致）。
- `src/assets/icons/` は README のみ。

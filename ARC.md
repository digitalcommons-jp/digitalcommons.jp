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
│   ├── images/          default.png / hero-placeholder.svg
│   └── styles/style.css 全スタイル（パレット・トークン・コンポーネント class）
├── cms/               Sveltia CMS（秘密パス CMS_PATH で配信）
│   ├── admin.astro      管理画面ページ（astro.config.ts の injectRoute で配信）
│   ├── config.yml       CMS 定義（コレクション・フィールド）
│   └── config.yml.ts    config.yml を ?raw で返すエンドポイント
├── components/        → 下記
├── content/           コンテンツ（content.config.ts のコレクション）
│   ├── pages/           固定ページ（about / follow / join / privacy / disclosure）
│   ├── posts/           記事（イベント記事含む）
│   └── settings/        home.yml（トップの並び）/ site.yml（サイト名・説明・連絡先）
├── i18n/ja.ts         UI 文言（キー → 日本語）
├── i18n/index.ts      t() と formatDate()
├── lib/
│   ├── content.ts       getPosts / getEvents / getTags / getSetting …
│   └── markdown.ts      rehype プラグイン（表を横スクロール可能にする。astro.config.ts から読込）
├── pages/             ルーティングのみ
├── content.config.ts  コレクション schema
├── env.d.ts           型参照
└── types.d.ts         `~/types`（MetaData）
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
│   └── LogoHorizon.astro  ヘッダが使用
│
├── 00_home/           pages/index.astro（セクション順は content/settings/home.yml が決定。番号は既定の並び）
│   ├── 01_hero.astro
│   ├── 03_pickup.astro
│   ├── 05_upcoming-event.astro
│   ├── 07_latest-posts.astro
│   └── 09_join-cta.astro
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

---

## CCD — Character-Cell Design（寸法の設計規則）

### 概要

CCD（Character-Cell Design）の原則をブラウザ上で実現するための実装仕様。

### 1. 基本単位

```css
:root {
  --cc-w: 1ch; /* JSによって実測px値に上書きされる */
}

body {
  font-size: 1rem;
  line-height: 1;
}
```

横方向はすべて `var(--cc-w)`、縦方向はすべて `rem` で表現する。

#### `1lh` ではなく `rem` を使う理由

`lh` はその要素自身の line-height を参照する。`font-size: 4rem` の h1 に `margin: 1lh` を適用すると `4rem` になる。body基準の1セルには `1rem` を使う。

### 2. グリッドスナップ（JS）

`1ch` はフォントと環境によって非整数pxになる。CSSの `auto` / `fr` はpx空間で演算するため誤差が蓄積する。JSによるスナップでこれを解消する。

#### 処理フロー

```
1. ruler要素で 1ch の実測px値を取得
2. --cc-w をその値に更新（CSSが再計算される）
3. 全要素のインラインwidthをリセット
4. requestAnimationFrame で新 --cc-w 適用後のレイアウトを測定
5. 全ブロックのwidthを chPx の整数倍にスナップ
6. paddingBlockEnd を調整して下端を remPx の整数倍にスナップ
7. コンテナを chPx 整合で中央寄せ
8. グリッド列幅を明示計算・設定
```

#### グリッド列の計算

```js
// 等分割 (data-cols="N")
const colPx = Math.floor((elW - gapsPx) / cols / chPx) * chPx;

// 左固定 (data-left-cols="N")
const rightPx = Math.floor((innerPx - leftPx - gapPx) / chPx) * chPx;
```

#### ブロック終端スナップ

```js
const remainder = blockHeight % remPx;
if (remainder > 0.01) {
  el.style.paddingBlockEnd = remPx - remainder + 'px';
}
```

ブロック終端をremグリッドに揃えることで、次のブロックの開始位置が保証される。

#### パフォーマンス

- 初回: ロード時1回のみ
- リサイズ: デバウンス100ms後
- スクロール: 登録なし

### 3. タイポグラフィ

#### line-height の選択

line-height は可読性を優先して選ぶ。ブロック終端の整合はJSが保証する。

```
TUI向けmonospace（低 x-height）  → line-height: 1rem で成立
コード向けmonospace（高 x-height）→ line-height: 2rem 推奨
proportional serif/sans          → line-height: 2rem 以上
CJK                              → line-height: 2rem 必須
```

`1rem` から試し、視覚的に成立する最小の整数remを選ぶ。

#### セル占有の定義

「セルを占有する」= ラインボックス境界の整合。グリフ（ink）の整合ではない。ink overflow はレイアウト違反ではない。

### 4. スペーシング

横方向: `calc(N * var(--cc-w))`
縦方向: `calc(N * 1rem)`

#### 0.5rem 例外

縦方向のみ許可。上下対称に使用し合計が整数セルになること。

```css
padding-block: 0.5rem; /* ✓ 合計 1rem */
padding-block-start: 0.5rem; /* ✗ 非対称 */
```

背景: `1lh > 1ch`（等幅フォントは縦長）。縦 padding を整数remにすると視覚的に過大になるため、0.5rem で対称的に詰められるようにしている。

### 5. ボーダー

`border` はbox modelに影響しセルサイズが崩れる。`box-shadow: inset` を使う。

```css
box-shadow: inset 0 0 0 1px currentColor;
```

### 6. レイアウト

#### コンテナ

```css
.container {
  width: calc(80 * var(--cc-w));
  max-width: 100%;
  padding-inline: calc(4 * var(--cc-w));
}
```

#### カラム

```css
/* JSが gridTemplateColumns を明示設定 */
[data-cols="N"]      /* 等分割Nカラム */
[data-left-cols="N"] /* 左N列固定 + 右auto */
```

ガター幅もセル数で指定する。

### 7. フォントモデル

#### 基準フォント

1つのmonospaceフォントが `1ch` の物理pxを定義する。TUI向けに設計されたフォント（inkがem-squareに収まる設計）がCCDSに最も適合する。

```
Terminus, Fixedsys, Perfect DOS VGA, Unistra A
```

コード向けフォント（JetBrains Mono, Cascadia Code等）はx-heightが高く、`line-height: 1rem` では詰まりやすい。

#### CJKとの整合

基準フォントが `1ch = 0.5em` の関係を持つとき、CJK文字（1em）は自然に2セルに整合する。この条件はフォント依存。

```
ui-monospace (SF Mono): 1ch = 0.5em → CJK = 2セル ✓
Menlo等:               1ch ≠ 0.5em → CJK がずれる可能性
```

### 8. コンポーネント

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

### 9. ルール

#### 端数セル禁止

端数セルは存在しない。0.5・1.5・2.75 などの端数倍は禁止。

例外: 縦方向のみ 0.5 セルを許可。上下対称に使用し合計が整数セルになること。

#### テキスト揃え

```
left    — 推奨
right   — 許可（数値・ラベル等）
center  — 原則禁止（文字数が奇数のとき半セルずれる）
justify — 禁止（文字間隔が変化しグリッドが崩れる）
```

#### レスポンシブ

レスポンシブ対応はセル数の再配分で行う。フォントサイズの縮小による対応は禁止。

# digitalcommons.jp

Digital Commons Japan のサイト。テーマは [AstroWind](https://github.com/arthelokyo/astrowind)（Astro + 素の CSS。Tailwind は使っていない）、公開は **Codeberg Pages**。

## 開発

```sh
npm install
npm run dev      # localhost:4321/digitalcommons.jp/
npm run build    # dist/ に静的出力
```

Node.js >= 22.22.3

## 公開 URL

|        | URL                                                       |
| ------ | --------------------------------------------------------- |
| サイト | https://digico.codeberg.page/digitalcommons.jp/           |
| CMS    | https://digico.codeberg.page/digitalcommons.jp/g7y3jf7ha/ |

## デプロイ（Codeberg Pages）

**Codeberg Actions**（`.forgejo/workflows/deploy.yml`）:

1. `npm ci && npm run build`
2. [git-pages action](https://codeberg.org/git-pages/action) で `dist/` を公開

手動:

```sh
npm run build
# dist/ の中身を pages ブランチへ push
```

## Sveltia CMS

- 設定: `public/g7y3jf7ha/config.yml`
- バックエンド: Codeberg `digico/digitalcommons.jp`
- ログイン: Codeberg OAuth（`app_id` 設定済み）または Access Token
- 記事: `src/data/post/*.md`（AstroWind のコンテンツコレクション）

## カスタマイズ

- サイト設定: `src/config.yaml`（base は `/digitalcommons.jp`）
- トップ: `src/pages/index.astro`
- フロントエンド（HTML / CSS）の編集: 下の「admins 向けマニュアル」を参照

## カスタムドメイン `digitalcommons.jp`（未稼働）

| Name                                      | Type | Value                                               |
| ----------------------------------------- | ---- | --------------------------------------------------- |
| `@`                                       | A    | `217.197.84.141`                                    |
| `@`                                       | AAAA | `2a0a:4580:103f:c0de::2`                            |
| `_git-pages-repository.digitalcommons.jp` | TXT  | `https://codeberg.org/digico/digitalcommons.jp.git` |

apex 配信時は `src/config.yaml` の `base` を `/` に変更。

---

# admins 向けマニュアル: HTML / CSS を編集する

## 0. 基本の流れ

```sh
npm install        # 初回のみ
npm run dev        # http://localhost:4321/ で確認しながら編集（保存すると自動反映）
npm run check      # 提出前に型・lint・整形をチェック
npm run fix        # lint / 整形を自動修正
npm run build      # 本番ビルド（dist/）。エラーが出ないことを確認
```

編集 → ブラウザで確認 → `npm run check` → commit / push。push すると Codeberg Actions が自動デプロイする。

## 1. どこに何があるか

| やりたいこと                                 | 触るファイル                                                                       |
| -------------------------------------------- | ---------------------------------------------------------------------------------- |
| 見た目（色・余白・サイズ・レイアウト）       | `src/assets/styles/style.css`（**ほぼ全部ここ**）                                  |
| 色・フォントの変数                           | `src/components/head/CustomStyles.astro`                                           |
| ブレークポイント                             | `style.css` の先頭 `@custom-media`                                                 |
| 全ページ共通の枠（`<head>`・ヘッダ・フッタ） | `src/components/frame/Layout.astro`                                                |
| ヘッダ / フッタ / ロゴ                       | `src/components/frame/`（`01_header` `03_main` `05_footer`）, `shared/Logo*.astro` |
| トップページの各セクションの HTML            | `src/components/00_home/*.astro`（01_hero … 11_join-cta）                          |
| トップのセクションの並び・表示 ON/OFF        | `src/content/settings/home.yml`                                                    |
| 記事カード                                   | `src/components/shared/PostCard.astro`                                             |
| 固定ページ（about, join など）の本文         | `src/content/pages/ja/*.md`（Markdown）                                            |
| ブログ記事                                   | `src/content/posts/*.md`                                                           |
| サイト名・メール・タグライン                 | `src/content/settings/site.yml`                                                    |
| ナビ等の UI 文言                             | `src/i18n/ja.ts`（英語は `en.ts`）                                                 |
| フォント設定                                 | `astro.config.ts` の `fonts`                                                       |
| 画像                                         | `src/assets/images/`                                                               |
| favicon・そのまま配信するファイル            | `public/`                                                                          |

`.astro` ファイルは「上の `---` の間が処理（TypeScript）、下が HTML」。HTML 部分は普通の HTML と同じように書ける。

## 2. 見た目を変える（CSS）

### 手順

1. ブラウザの DevTools で直したい要素を選び、`class` 名を確認する（例: `hero-title`）。
2. `style.css` でその class を検索する。
3. 値を変えて保存。ブラウザに即反映される。

`style.css` は見出しコメントでセクション分けされている（Reset / Logo / Header / Hero / Buttons / Navigation / Sections・Grids / Post card / Join band・Footer / Prose）。まず該当セクションを探す。

### 色・フォント

`CustomStyles.astro` の変数を変える。サイトの強調色は 1 色のみ。

```css
--aw-color-primary: rgb(15 118 110); /* これを変えるとサイト全体の色が変わる */
```

フォントは Fira Sans（`astro.config.ts` で自前ホスト）。日本語はシステムの日本語ゴシックにフォールバックする。

### ブレークポイント（mobile / tablet / desktop の切替幅）

`style.css` 先頭の 3 つだけが定義。**幅を変えるときはここだけ**。

```css
@custom-media --bp-sm (min-width: 36rem); /* 576px */
@custom-media --bp-md (min-width: 48rem); /* 768px */
@custom-media --bp-lg (min-width: 64rem); /* 1024px */
```

使い方は `@media (--bp-md) { ... }`（「768px 以上」）。モバイル用のスタイルを先に書き、広い画面で上書きする（mobile-first）。**`@media (min-width: 48rem)` のように直接書かない。**
CSS 変数（`var(--x)`）は `@media` の条件の中では使えない仕様なので、`@custom-media` を使っている。

## 3. このサイトの CSS ルール（CCD）

[CCD.md](./CCD.md) に詳細がある。文字セル（Character-Cell）の整数倍で寸法を揃える設計。実作業で守ること:

- **単位は `rem` のみ。`px` を書かない。**（576px は `36rem`）
- 横方向の寸法は `calc(N * var(--cc-w))`。`--cc-w` は 1 文字幅 = `0.5rem`（全角 1 字 = 2 セル）。
- 縦方向の寸法は整数の `rem`。例外として `padding-block: 0.5rem` のみ、上下対称で使える。
- 枠線は `border` ではなく `box-shadow: inset 0 0 0 1px ...`（箱のサイズが変わるのを防ぐ）。
- テキストは左揃え。

迷ったら既存の class（`.btn`、`.container-cc`、`.section` など）をまねる。

## 4. HTML を変える

- ページの部品は `src/components/NN_<page>/` に置く（構成は `ARC.md`）。ファイル名の番号は上から下の表示順。
- トップの各セクション: `src/components/00_home/` の該当ファイルを編集。
- 共通の枠・ヘッダ・フッタ: `components/frame/Layout.astro` / `01_header.astro` / `05_footer.astro`。
- 文言は `.astro` に直書きするより `src/i18n/ja.ts` のキー（`t('nav.join')`）を使う。英語版に備えて `en.ts` にも同じキーを足す。
- 画像は `import` して `<Image>` で表示する（最適化される）。例は `00_home/01_hero.astro`。
- 新しい class を足したら、`style.css` に対応するスタイルを書く。

### トップのセクションを並べ替える・隠す

`src/content/settings/home.yml` の `sections` を編集する。上から順に表示され、`enabled: false` で非表示。HTML は触らなくてよい。

### 自由枠（custom）にコンポーネントを足す

1. `src/components/00_home/custom/` に `.astro` を作る（`ExampleBlock.astro` を雛形にする）。
2. `src/components/00_home/custom/index.ts` の `customComponents` に登録する。
3. `home.yml` に `type: custom` / `component: <名前>` / `props:` を書く。

### 新しい固定ページ

`src/content/pages/ja/` に Markdown を追加し、`[slug].astro` が表示する。本文のスタイルは `style.css` の「Prose」セクション。

## 5. 確認すること

- 幅を変えて確認する（DevTools のレスポンシブ表示で 576 / 768 / 1024px の前後）。
- 本文の日本語が崩れていないか。
- `npm run check` と `npm run build` が通るか。
- `npm run dev` が既に動いていないか。ポート 4321 が使用中だと起動できない。

## 6. 注意

- `style.css` は PostCSS / Tailwind を使わない。`@apply` や Tailwind の class（`md:flex` など）は動かない。
- `AGENTS.md` と `.agents/skills/` には、AstroWind テンプレート時代の古い記述（Tailwind 前提）が残っている。このマニュアルと実コードを優先すること。
- 記事の追加・編集は CMS（上の「Sveltia CMS」）からもできる。HTML / CSS の変更だけがコード編集の対象。

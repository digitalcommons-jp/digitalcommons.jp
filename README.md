# digitalcommons.jp

Digital Commons Japan のサイト。Astro + 素の CSS（Tailwind は使っていない。もとは AstroWind テンプレート）、本番は VPS「v2」、ミラーは Codeberg Pages。

## 開発

```sh
npm install
npm run dev      # localhost:4321
npm run build    # dist/ に静的出力
```

Node.js >= 22.22.3

## 公開 URL

|        | URL                                             |
| ------ | ----------------------------------------------- |
| 本番   | https://digitalcommons.jp/                      |
| ミラー | https://digico.codeberg.page/digitalcommons.jp/ |
| CMS    | 秘密のパス（下の「Sveltia CMS」）               |

## デプロイ

### 本番（VPS「v2」）

**ビルドは手元で行い、`dist/` を v2 に送るだけ。サーバーではビルドしない。**

```sh
scripts/deploy.sh --dry-run   # 何が変わるかだけ確認
scripts/deploy.sh             # ビルドして /opt/dc/dist に rsync
```

- サイト本体: `/opt/dc/dist`（Caddy が配信）。
- **Caddyfile の正本は `~/dev/v2/Caddyfile`**（v2 の `/etc/caddy/Caddyfile` と同一内容）。v2 上の複数プロジェクトが 1 つの Caddyfile を共有しているため、このリポジトリは Caddyfile を持たない。`digitalcommons.jp` のブロックを変えるときは `~/dev/v2/Caddyfile` を直し、`~/did.md/deploy.sh client` で配る。
- **ID ドキュメント（`.well-known/did.json`、`did.jsonl`、`did-witness.json`）は、サイトとは別の場所**: `/var/lib/dc-host/root/.well-known/`。`dc-host.service`（`byo-host`、`127.0.0.1:8796`）が唯一の書き手で、Caddy は読み取りだけを配信する。書き込み（`PUT/POST/DELETE/OPTIONS`）は byo-host に転送される。
- そのため、サイトを再デプロイしても、ID のファイルは上書きも削除もされない（`scripts/deploy.sh` は念のため、これらも `--exclude` している）。
- リポジトリの `public/.well-known/` には、`atproto-did`（固定の文字列）だけを置く。ID ドキュメントはリポジトリで管理しない。
- **standard.site の公開と取り下げ**: `SEQUOIA=1 scripts/deploy.sh` で、`social: true` の記事を公開する。Sequoia は削除をしないので、記事を消した・下書きにした・`social: false` にしたときは、`scripts/sequoia-prune.mjs` が PDS 上の `site.standard.document` を消す（通常は一覧表示だけ。実際に消すのは `PRUNE=1 SEQUOIA=1 scripts/deploy.sh`）。自分のリポジトリの `site.standard.document` 以外は、決して消さない。

### パス振り分け（GoToSocial との衝突調査）

稼働中の GoToSocial（gts.superseriousbusiness.org）で 2026-10-01 に確認した結果。

| パス                                                                                  | GoToSocial                               | 振り分け                                      |
| ------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------- |
| `/.well-known/webfinger` `host-meta` `nodeinfo`、`/nodeinfo/*`                        | あり                                     | GoToSocial                                    |
| `/@*` `/users/*` `/api/*` `/oauth/*` `/auth/*` `/fileserver/*` `/settings/*` `/login` | あり                                     | GoToSocial                                    |
| **`/about`**                                                                          | **あり（衝突）**                         | **Astro**（許可リストに入れない）             |
| **`/admin`**                                                                          | `/settings/admin` へリダイレクト（衝突） | **Astro**（CMS の入口。許可リストに入れない） |
| **`/tags/<x>`**                                                                       | **あり（衝突）**                         | **Astro**（下記の注意）                       |
| `/robots.txt`                                                                         | あり                                     | Astro（許可リスト外）                         |
| `/.well-known/site.standard.publication`                                              | なし                                     | Astro                                         |
| `/join` `/projects` `/events` `/privacy` `/disclosure` `/feed.xml` `/posts/*`           | なし                                     | Astro                                         |

**注意**: GoToSocial の投稿に付いたハッシュタグのリンクは `https://digitalcommons.jp/tags/<名前>` 形式。これは Astro のタグページ（`/tags/<タグ>`）に流れる。該当するタグが無ければ 404 になる。気になるなら、サイトのタグページを別のパス（例 `/topics/`）に移す。

### ミラー（Codeberg Pages）

**Codeberg Actions**（`.forgejo/workflows/deploy.yml`）が、main への push で `npm ci && npm run build` を実行し、[git-pages action](https://codeberg.org/git-pages/action) で `dist/` を公開する。

手動:

```sh
npm run build
# dist/ の中身を pages ブランチへ push
```

## Sveltia CMS

- 置き場所: `/` ではなく推測できない秘密のパス。`.env` の `CMS_PATH`（コミットしない。生成は `openssl rand -hex 12`）。ビルド時にだけ使われ、`CMS_PATH` が無いビルドには CMS が含まれない。**CMS を載せるビルドは手元（`.env` のある場所）で行う。**
- 設定: `src/cms/config.yml`
- バックエンド: Codeberg `digico/digitalcommons.jp`
- ログイン: Codeberg OAuth（`app_id` 設定済み。リダイレクト URI もこの秘密のパス）または Access Token
- 記事: `src/content/posts/*.md`

## カスタマイズ

- サイト設定: `astro.config.ts`（`site`）と `src/content/settings/site.yml`
- トップ: `src/pages/index.astro`
- フロントエンド（HTML / CSS）の編集: 下の「admins 向けマニュアル」を参照

## ミラーの DNS（Codeberg Pages に切り替えるとき）

| Name                                      | Type | Value                                               |
| ----------------------------------------- | ---- | --------------------------------------------------- |
| `@`                                       | A    | `217.197.84.141`                                    |
| `@`                                       | AAAA | `2a0a:4580:103f:c0de::2`                            |
| `_git-pages-repository.digitalcommons.jp` | TXT  | `https://codeberg.org/digico/digitalcommons.jp.git` |

apex 配信時は `base` を `/`（既定）のままにする。

---

# admins 向けマニュアル: HTML / CSS を編集する

## 0. 基本の流れ

```sh
npm install        # 初回のみ
npm run dev        # http://localhost:4321/ で確認しながら編集（保存すると自動反映）
npm run check      # 提出前に型をチェック
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
| トップページの各セクションの HTML            | `src/components/00_home/*.astro`（01_hero … 09_join-cta）                          |
| トップの行の並び・表示 ON/OFF                | `src/pages/index.astro`（部品を上から並べる）                                      |
| イベント・プロジェクトの 1 行                | `src/components/shared/ItemRow.astro`                                              |
| 固定ページ（about, join など）の本文         | `src/content/pages/*.md`（Markdown）                                               |
| ブログ記事                                   | `src/content/posts/*.md`                                                           |
| サイト名・メール・タグライン                 | `src/content/settings/site.yml`                                                    |
| ナビ等の UI 文言                             | `src/i18n/ja.ts`                                                                   |
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

[ARC.md](./ARC.md) の「CCD」に詳細がある。文字セル（Character-Cell）の整数倍で寸法を揃える設計。実作業で守ること:

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
- 文言は `.astro` に直書きするより `src/i18n/ja.ts` のキー（`t('nav.join')`）を使う。
- 画像は `import` して `<Image>` で表示する（最適化される）。例は `00_home/01_hero.astro`。
- 新しい class を足したら、`style.css` に対応するスタイルを書く。

### トップの行を並べ替える・隠す・足す

`src/pages/index.astro` に部品が上から順に並んでいる。行を入れ替える・コメントアウトする・足すのは、このファイルを編集する。新しい行は `src/components/00_home/` に奇数番号の `.astro` を作る（最外側は `<section class="row">`。幅 100%・margin 0）。中身を本文幅に収めたい行だけ、内側に `<div class="container-cc">` を置く。

### 新しい固定ページ

`src/content/pages/` に Markdown を追加し、`[slug].astro` が表示する。本文のスタイルは `style.css` の「Prose」セクション。

## 5. 確認すること

- 幅を変えて確認する（DevTools のレスポンシブ表示で 576 / 768 / 1024px の前後）。
- 本文の日本語が崩れていないか。
- `npm run check` と `npm run build` が通るか。
- `npm run dev` が既に動いていないか。ポート 4321 が使用中だと起動できない。

## 6. 注意

- `style.css` は PostCSS / Tailwind を使わない。`@apply` や Tailwind の class（`md:flex` など）は動かない。
- 記事の追加・編集は CMS（上の「Sveltia CMS」）からもできる。HTML / CSS の変更だけがコード編集の対象。

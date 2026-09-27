# digitalcommons.jp

Digital Commons Japan のモックサイト。[Astro](https://astro.build) + [Sveltia CMS](https://sveltiacms.app/)、公開は **Codeberg Pages** のみ。

## 開発

```sh
npm install
npm run dev      # localhost:4321/digitalcommons.jp/
npm run build    # dist/ に静的出力
```

## 公開 URL

| | URL |
|--|--|
| サイト | https://digico.codeberg.page/digitalcommons.jp/ |
| CMS | https://digico.codeberg.page/digitalcommons.jp/g7y3jf7ha/ |

Git リモートは **origin = Codeberg** だけ。

## デプロイ（Codeberg Pages）

**Codeberg Actions** が有効。`main` への push で [`.forgejo/workflows/deploy.yml`](.forgejo/workflows/deploy.yml) が走ります。

1. `npm ci && npm run build`（Astro）
2. [git-pages action](https://codeberg.org/git-pages/action) で `dist/` を Codeberg Pages に公開

手動デプロイも可:

```sh
npm run build
# dist/ の中身を pages ブランチとして push
```

## Sveltia CMS

管理画面（非公開パス）: **https://digico.codeberg.page/digitalcommons.jp/g7y3jf7ha/**

- 設定: [`public/g7y3jf7ha/config.yml`](public/g7y3jf7ha/config.yml)
- バックエンド: Codeberg（Gitea） `digico/digitalcommons.jp` / ブランチ `main`
- ログイン: **Sign In with Token**（Codeberg のアクセストークン、repo 書き込み権限）
- 任意で PKCE OAuth: Codeberg の Settings → Applications で OAuth2 アプリをつくり
  - Redirect URI: `https://digico.codeberg.page/digitalcommons.jp/g7y3jf7ha/`
  - Confidential をオフにして、`app_id:` を config に記入
- メディア: `public/media/` → URL `/digitalcommons.jp/media/`
- 編集対象:
  - `src/content/settings/site.json`
  - `src/content/home/*.json`
  - `src/content/projects/*.md`
  - `src/content/posts/*.md`

## カスタムドメイン `digitalcommons.jp`（未稼働）

2026-09-26 時点で公開 DNS なし（NXDOMAIN）。取得後は Codeberg Pages を指し、下記を設定:

| Name | Type | Value |
|------|------|-------|
| `@` | A | `217.197.84.141` |
| `@` | AAAA | `2a0a:4580:103f:c0de::2` |
| `_git-pages-repository.digitalcommons.jp` | TXT | `https://codeberg.org/digico/digitalcommons.jp.git` |

※ `astro.config.mjs` の `base: '/digitalcommons.jp'` はパス配信用。apex ドメインにしたら `base: '/'` に変更。

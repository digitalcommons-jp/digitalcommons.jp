# digitalcommons.jp

Digital Commons Japan のサイト。テーマは [AstroWind](https://github.com/arthelokyo/astrowind)（Astro + Tailwind CSS）、公開は **Codeberg Pages**。

## 開発

```sh
npm install
npm run dev      # localhost:4321/digitalcommons.jp/
npm run build    # dist/ に静的出力
```

Node.js >= 22.22.3

## 公開 URL

| | URL |
|--|--|
| サイト | https://digico.codeberg.page/digitalcommons.jp/ |
| CMS | https://digico.codeberg.page/digitalcommons.jp/g7y3jf7ha/ |

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
- デザイン: `.agents/skills/styling.md` / `src/components/CustomStyles.astro`

## カスタムドメイン `digitalcommons.jp`（未稼働）

| Name | Type | Value |
|------|------|-------|
| `@` | A | `217.197.84.141` |
| `@` | AAAA | `2a0a:4580:103f:c0de::2` |
| `_git-pages-repository.digitalcommons.jp` | TXT | `https://codeberg.org/digico/digitalcommons.jp.git` |

apex 配信時は `src/config.yaml` の `base` を `/` に変更。

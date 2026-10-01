# デプロイ手順書（P5）

VPS 上で digitalcommons.jp を配信するための設定一式。**どれも実機では未検証**（Caddy・webhook・VPS がまだない）。確認済みなのは「パス振り分けの調査」と「Codeberg Pages の挙動」だけ。

```
deploy/
  Caddyfile              リバースプロキシ（GoToSocial 許可リスト + Astro）
  env.example            環境変数の雛形 → /etc/digitalcommons/env
  webhook/hooks.json     Forgejo の push を受ける（署名検証 + main のみ）
  webhook/trigger.sh     publish.sh をバックグラウンドで起動
  webhook/webhook.service systemd ユニット
scripts/publish.sh       冪等な公開スクリプト（1本）
```

## 1. 当面の構成（VPS 配信）

1. VPS に `deploy` ユーザーを作り、リポジトリを `/opt/digitalcommons` に clone する（読み取り専用 deploy key で足りる）。
2. 必要なもの: Node 22 以上、rsync、Caddy、[adnanh/webhook](https://github.com/adnanh/webhook)。
3. `/etc/digitalcommons/env` を `deploy/env.example` から作る（`chmod 600`）。シークレットはここだけに置く。
4. `/var/www/digitalcommons.jp/releases` を `deploy` ユーザーが書けるようにする。Caddy は `current`（symlink）を配信する。
5. `deploy/Caddyfile` を `/etc/caddy/Caddyfile` に置き、`caddy validate` → `systemctl reload caddy`。
6. `webhook.service` を `/etc/systemd/system/` に置いて起動する。
7. Codeberg のリポジトリ設定 → Webhooks で、`https://digitalcommons.jp/hooks/publish` に POST（Forgejo 形式、シークレットは `WEBHOOK_SECRET`、push のみ）を追加する。
8. 初回は手で `scripts/publish.sh` を実行して通ることを確認する。`DRY_RUN=1` ならビルドだけ（デプロイ・投稿なし）。

`publish.sh` は同時に1つしか動かない（`flock`）。2回目は待ってから動くので、最新の push が取りこぼされない。

### 試運転（本番ビルドを localhost だけで動かす）

既存サイトに影響を与えずに確認する方法。`deploy/Caddyfile.local` は `127.0.0.1:4400` だけで待ち受ける（TLS・GoToSocial なし）。

```bash
rsync -az --delete --exclude node_modules --exclude dist --exclude .git --exclude .astro ./ v2:/opt/dc/
ssh v2 'cd /opt/dc && npm ci && npm run build'
ssh v2 'cd /opt/dc && setsid nohup caddy run --config deploy/Caddyfile.local --adapter caddyfile > caddy-local.log 2>&1 < /dev/null &'
ssh -L 4400:127.0.0.1:4400 v2    # 手元の http://localhost:4400 で見る
```

## 2. パス振り分け（調査結果）

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
| `/follow` `/join` `/events` `/privacy` `/disclosure` `/feed.xml` `/posts/*`           | なし                                     | Astro                                         |

**注意**: GoToSocial の投稿に付いたハッシュタグのリンクは `https://digitalcommons.jp/tags/<名前>` 形式。これは Astro のタグページ（`/tags/<タグ>`）に流れる。該当するタグが無ければ 404 になる。気になるなら、サイトのタグページを別のパス（例 `/topics/`）に移す。

PLAN §2.3 の初期案から変えた点: `/admin/*` と `/emoji/*` を許可リストから外した（前者は CMS と衝突、後者は GoToSocial に存在しなかった）。`/assets/*` は残した（Astro 側は `/_astro` を使うので衝突しない）。

## 3. 最終形: Codeberg Pages へ移行する

Codeberg Pages（git-pages）の挙動を 2026-10-01 に調べた結果:

- `https://digico.codeberg.page/digitalcommons.jp/` で配信されている。
- `/about` のようなスラッシュなしの URL は、`302` で `/about/` へ転送され、`Location` にプレフィックス `/digitalcommons.jp` が付く。
- 存在しないパスは、自前の 404 ページを返し、ステータスも `404`。
- 404 ページ・`robots.txt` は問題なし。

`Caddyfile` の `site_pages` はこれに合わせてある（ディレクトリ風のパスに `/` を足して送る、プレフィックスを付ける、`Location` のプレフィックスを外す）。移行手順:

1. **今の Forgejo ワークフロー**（`.forgejo/workflows/deploy.yml`）は main への push で `dist` を Pages に公開する。ビルドは `base: /` なので、`digico.codeberg.page/digitalcommons.jp/` を直接開くとアセットが読めない。プロキシ越しでのみ正しく動く。
2. Pages 側に新しいビルドが載ったことを、`curl https://digico.codeberg.page/digitalcommons.jp/` で確認する。
3. Caddyfile の `import site_static` を `import site_pages` に変えて reload する（`/.well-known/site.standard.publication` と `/_astro/*` の2か所を含め、3か所）。
4. 確認: `/`、`/about`（リダイレクトが起きない）、存在しないパス（404）、`/feed.xml`、`/.well-known/site.standard.publication`。
5. `publish.sh` のデプロイ先は、Pages をワークフローが担当するなら `DEPLOY_MODE=pages` ではなく、デプロイ手順を省く形にする。Sequoia と GoToSocial 投稿だけを `publish.sh` で行う運用を想定している。

## 4. 未検証・要確認

- Caddyfile の構文（`caddy validate` 未実施）。
- `/.well-known/site.standard.publication` が Pages から返るか。`dist` に `.well-known/` はあるが、git-pages がドットから始まるフォルダを公開するか未確認。出ない場合は、Caddy 側でこのパスだけ直接 `respond` する。
- Forgejo の署名ヘッダー名（`X-Forgejo-Signature`）。受け口で届いたヘッダーを確認する。
- `DEPLOY_MODE=pages`（`pages` ブランチへの push）は未実装の部分が多い。git-pages 方式のため、既存のワークフローの利用を優先する。
- Sequoia の CI／VPS からの認証方式。

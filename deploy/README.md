# デプロイ手順書

digitalcommons.jp を VPS「v2」で配信するための手順。このフォルダには手順書だけを置く。サーバー設定（Caddyfile）はプロジェクト内に持たない。

## 1. 配信の構成

**ビルドは手元で行い、`dist/` を v2 に送るだけ。サーバーではビルドしない。**

```bash
scripts/deploy.sh --dry-run   # 何が変わるかだけ確認
scripts/deploy.sh             # ビルドして /opt/dc/dist に rsync
```

- サイト本体: `/opt/dc/dist`（Caddy が配信）。
- **Caddyfile の正本は `~/dev/v2/Caddyfile`**（v2 の `/etc/caddy/Caddyfile` と同一内容。2026-10-04 に v2 から取得）。v2 上の複数プロジェクトが 1 つの Caddyfile を共有しているため、個別のプロジェクトは自前の Caddyfile を持たない。`digitalcommons.jp` のブロックを変えるときは `~/dev/v2/Caddyfile` を直す。
- **ID ドキュメント（`.well-known/did.json`、`did.jsonl`、`did-witness.json`）は、サイトとは別の場所**: `/var/lib/dc-host/root/.well-known/`。`dc-host.service`（`byo-host`、`127.0.0.1:8796`）が唯一の書き手で、Caddy は `root @identity` でそこから読み取りだけを配信する。書き込み（`PUT/POST/DELETE/OPTIONS`）は byo-host に転送される。
- そのため、サイトを再デプロイしても、ID のファイルは上書きも削除もされない（`scripts/deploy.sh` は念のため、これらも `--exclude` している）。
- リポジトリの `public/.well-known/` には、`atproto-did`（固定の文字列）だけを置く。ID ドキュメントは、リポジトリで管理しない。
- **standard.site の公開と取り下げ**: `SEQUOIA=1 scripts/deploy.sh` で、`social: true` の記事を公開する。Sequoia は削除をしないので、記事を消した・下書きにした・`social: false` にしたときは、`scripts/sequoia-prune.mjs` が、PDS 上の `site.standard.document` を消す（通常は一覧表示だけ。実際に消すのは `PRUNE=1 SEQUOIA=1 scripts/deploy.sh`）。自分のリポジトリの `site.standard.document` 以外は、決して消さない。
- **CMS は `/admin` ではなく、推測できない秘密のパスに置く。** パスは `.env` の `CMS_PATH`（コミットしない。雛形は `.env.example`、生成は `openssl rand -hex 12`）。ビルド時にだけ使われ、`CMS_PATH` が無いビルドには CMS が含まれない。そのため、**CMS を載せるビルドは手元（`.env` のある場所）で行う**。Codeberg の OAuth アプリのリダイレクト URI も、この秘密のパスになる。

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

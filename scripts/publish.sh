#!/usr/bin/env bash
# Idempotent publish pipeline (PLAN §8.1). Safe to run repeatedly and from any trigger
# (webhook, CI, by hand). Runs one at a time (flock); a second run waits for the first.
#
#   scripts/publish.sh                # full run
#   DRY_RUN=1 scripts/publish.sh      # build only; Sequoia/GoToSocial in dry-run; no deploy
#
# Config (environment, e.g. from /etc/digitalcommons/env — never committed):
#   DEPLOY_MODE   vps (default) | pages
#   DEPLOY_ROOT   vps: directory holding releases/ and the `current` symlink Caddy serves
#   SKIP_PULL     1 = do not git pull (local testing)
#   SEQUOIA       1 = publish to standard.site (needs `sequoia auth` done for this user)
#   GTS_URL, GTS_TOKEN   GoToSocial base URL and a write:statuses token (omit = skip posting)
set -euo pipefail

cd "$(dirname "$0")/.."
REPO="$PWD"
DEPLOY_MODE="${DEPLOY_MODE:-vps}"
DEPLOY_ROOT="${DEPLOY_ROOT:-/var/www/digitalcommons.jp}"
DRY_RUN="${DRY_RUN:-0}"

log() { printf '[publish %s] %s\n' "$(date +%H:%M:%S)" "$*"; }

# One run at a time. Waiting (not skipping) means the latest push is never lost.
exec 9>"$REPO/.publish.lock"
flock -w 900 9 || { log "could not get the lock"; exit 1; }

# 1. Source
if [ "${SKIP_PULL:-0}" != 1 ]; then
  log "git pull"
  git pull --ff-only origin main
fi

# 2. Build
log "npm ci + build"
npm ci --no-audit --no-fund
npm run build

# 3. standard.site (Sequoia). Runs on a throw-away copy so `atUri` write-backs never
#    touch the files editors work on (PLAN §8.3, option 1). State: .sequoia-state.json.
if [ "${SEQUOIA:-0}" = 1 ]; then
  log "sequoia publish"
  npm run --silent prepare:sequoia
  if [ "$DRY_RUN" = 1 ]; then npx sequoia-cli publish --dry-run; else npx sequoia-cli publish; fi
  log "sequoia inject"
  if [ "$DRY_RUN" = 1 ]; then npx sequoia-cli inject --dry-run; else npx sequoia-cli inject; fi
else
  log "sequoia: skipped (SEQUOIA!=1)"
fi

if [ "$DRY_RUN" = 1 ]; then
  log "dry run: skipping deploy"
  node scripts/social-post.mjs --dry-run
  exit 0
fi

# 4. Deploy
case "$DEPLOY_MODE" in
  vps)
    release="$DEPLOY_ROOT/releases/$(date +%Y%m%d%H%M%S)"
    log "deploy -> $release"
    mkdir -p "$release"
    rsync -a --delete dist/ "$release/"
    ln -sfn "$release" "$DEPLOY_ROOT/current.new"
    mv -Tf "$DEPLOY_ROOT/current.new" "$DEPLOY_ROOT/current"   # atomic switch
    ls -1dt "$DEPLOY_ROOT"/releases/* | tail -n +6 | xargs -r rm -rf   # keep 5
    ;;
  pages)
    # Final form: push dist to the `pages` branch of the Codeberg repo. Untested; see deploy/README.md.
    log "deploy -> pages branch"
    tmp="$(mktemp -d)"
    git clone --quiet --branch pages --single-branch "$(git remote get-url origin)" "$tmp" 2>/dev/null \
      || { git clone --quiet "$(git remote get-url origin)" "$tmp"; git -C "$tmp" checkout --orphan pages; }
    find "$tmp" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
    cp -a dist/. "$tmp/"
    git -C "$tmp" add -A
    git -C "$tmp" -c user.name=publish -c user.email=publish@digitalcommons.jp commit -q -m "publish $(git rev-parse --short HEAD)" || log "pages: no changes"
    git -C "$tmp" push --quiet origin pages
    rm -rf "$tmp"
    ;;
  *) log "unknown DEPLOY_MODE=$DEPLOY_MODE"; exit 1 ;;
esac

# 5. Fediverse (POSSE). Idempotent via .social-state.json; skipped when no token.
if [ -n "${GTS_TOKEN:-}" ] && [ -n "${GTS_URL:-}" ]; then
  log "gotosocial post"
  node scripts/social-post.mjs
else
  log "gotosocial: skipped (GTS_URL / GTS_TOKEN not set)"
fi

log "done"

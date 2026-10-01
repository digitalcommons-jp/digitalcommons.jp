#!/usr/bin/env bash
# Build locally and ship dist/ to the server. Nothing is built on the server.
#
#   scripts/deploy.sh              # build + rsync
#   scripts/deploy.sh --dry-run    # build + show what rsync would change (Sequoia: dry-run too)
#   SEQUOIA=1 scripts/deploy.sh    # also publish `social: true` posts to standard.site first
#
#   DEPLOY_HOST (default v2)   DEPLOY_DIR (default /opt/dc/dist)
#
# (-rlpt, not -a: without -o/-g the files are owned by the server-side user, i.e. root.)
# The identity documents (.well-known/did.json, did.jsonl, did-witness.json) are owned by
# byo-host (dc-host.service) in /var/lib/dc-host/root and are served from there by Caddy.
# They are excluded here, so a deploy can never overwrite or delete them.
set -euo pipefail
cd "$(dirname "$0")/.."

host="${DEPLOY_HOST:-v2}"
dir="${DEPLOY_DIR:-/opt/dc/dist}"
extra=()
[ "${1:-}" = "--dry-run" ] && extra+=(--dry-run --itemize-changes)

npm run build

# standard.site (PLAN §6.2): publish on a throw-away copy of the posts (prepare:sequoia), then put
# the verification <link> tags into the built pages. Needs `sequoia auth` done as this user.
# State lives in .sequoia-state.json (gitignored) -- keep it: losing it makes the next run
# publish the same posts again.
if [ "${SEQUOIA:-0}" = 1 ]; then
  npm run --silent prepare:sequoia
  if [ "${1:-}" = "--dry-run" ]; then
    npx sequoia-cli publish --dry-run
    npx sequoia-cli inject --dry-run
  else
    npx sequoia-cli publish
    npx sequoia-cli inject
  fi
fi
rsync -rlptz --delete \
  --exclude '.well-known/did.json' --exclude '.well-known/did.jsonl' --exclude '.well-known/did-witness.json' \
  "${extra[@]}" dist/ "$host:$dir/"
if [ "${1:-}" = "--dry-run" ]; then echo "dry run: nothing was changed on $host"; else echo "deployed dist/ -> $host:$dir"; fi

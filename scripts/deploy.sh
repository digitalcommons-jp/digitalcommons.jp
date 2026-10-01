#!/usr/bin/env bash
# Build locally and ship dist/ to the server. Nothing is built on the server.
#
#   scripts/deploy.sh              # build + rsync
#   scripts/deploy.sh --dry-run    # build + show what rsync would change
#
#   DEPLOY_HOST (default v2)   DEPLOY_DIR (default /opt/dc/dist)
#
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
rsync -az --delete \
  --exclude '.well-known/did.json' --exclude '.well-known/did.jsonl' --exclude '.well-known/did-witness.json' \
  "${extra[@]}" dist/ "$host:$dir/"
if [ "${1:-}" = "--dry-run" ]; then echo "dry run: nothing was changed on $host"; else echo "deployed dist/ -> $host:$dir"; fi

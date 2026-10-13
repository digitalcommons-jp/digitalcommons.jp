#!/usr/bin/env bash
# Build locally and ship dist/ to the server. Nothing is built on the server.
#
#   scripts/deploy.sh              # build + rsync
#   scripts/deploy.sh --dry-run    # build + show what rsync would change (Sequoia: dry-run too)
#   SEQUOIA=1 scripts/deploy.sh    # also publish `social: true` posts to standard.site first;
#                                  # posts that are gone / draft / social:false are only LISTED
#   SEQUOIA=1 PRUNE=1 scripts/deploy.sh   # ...and their standard.site records are DELETED
#
#   DEPLOY_HOST (default v2)   DEPLOY_DIR (default /opt/dc/dist)
#
# (-rlpc, not -a: without -o/-g the files are owned by the server-side user, i.e. root; -c compares
# content, not mtime, so a rebuild only sends what really changed and --dry-run stays readable.)
# The identity documents (.well-known/did.json, did.jsonl, did-witness.json) are owned by
# byo-host (dc-host.service) in /var/lib/dc-host/root and are served from there by Caddy.
# They are excluded here, so a deploy can never overwrite or delete them.
set -euo pipefail
cd "$(dirname "$0")/.."

host="${DEPLOY_HOST:-v2}"
dir="${DEPLOY_DIR:-/opt/dc/dist}"
extra=()
[ "${1:-}" = "--dry-run" ] && extra+=(--dry-run --itemize-changes)

pnpm build

# standard.site: publish on a throw-away copy of the posts (prepare:sequoia), then put
# the verification <link> tags into the built pages. Needs `sequoia auth` done as this user.
# State lives in .sequoia-state.json (gitignored) -- keep it: losing it makes the next run
# publish the same posts again.
if [ "${SEQUOIA:-0}" = 1 ]; then
  pnpm --silent prepare:sequoia
  if [ "${1:-}" = "--dry-run" ]; then
    pnpm exec sequoia-cli publish --dry-run
    node scripts/sequoia-prune.mjs
    pnpm exec sequoia-cli inject --dry-run
  else
    pnpm exec sequoia-cli publish
    # Sequoia never deletes. Unpublishing is a separate, explicit step (PRUNE=1).
    if [ "${PRUNE:-0}" = 1 ]; then node scripts/sequoia-prune.mjs --yes; else node scripts/sequoia-prune.mjs; fi
    pnpm exec sequoia-cli inject
  fi
fi
rsync -rlpcz --delete --exclude '.gitkeep' \
  --exclude '.well-known/did.json' --exclude '.well-known/did.jsonl' --exclude '.well-known/did-witness.json' \
  ${extra[@]+"${extra[@]}"} dist/ "$host:$dir/"
if [ "${1:-}" = "--dry-run" ]; then echo "dry run: nothing was changed on $host"; else echo "deployed dist/ -> $host:$dir"; fi

#!/usr/bin/env bash
# Shortcut for scripts/deploy.sh (build locally, rsync dist/ to the server). All arguments and the
# DEPLOY_HOST / DEPLOY_DIR / SEQUOIA / PRUNE variables are passed through. See scripts/deploy.sh.
#
#   ./deploy.sh --dry-run    # build + show what would change
#   ./deploy.sh              # build + deploy
exec "$(dirname "$0")/scripts/deploy.sh" "$@"

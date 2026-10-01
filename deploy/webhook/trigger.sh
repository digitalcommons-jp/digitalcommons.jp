#!/usr/bin/env bash
# Called by the webhook. Starts publish.sh in the background so the webhook can answer
# immediately (Forgejo gives up on slow receivers). publish.sh serialises itself with flock.
set -euo pipefail
cd /opt/digitalcommons
set -a; . /etc/digitalcommons/env; set +a
setsid nohup scripts/publish.sh >> /var/log/digitalcommons-publish.log 2>&1 < /dev/null &

#!/usr/bin/env bash
# Copy local uploaded files (storage/app/public) to the VPS.
# Database sync (pg_dump) does NOT include these files — run this after sync-to-vps.sh
# if you need branding images, documents, etc. on production.
set -euo pipefail

SSH_HOST="${SSH_HOST:-alphabridge-ts}"
REMOTE_STORAGE="${REMOTE_STORAGE:-/var/www/school_management_system/backend-laravel/storage/app/public}"
LOCAL_STORAGE="$(cd "$(dirname "$0")/../.." && pwd)/backend-laravel/storage/app/public"

confirm="${1:-}"

if [[ "$confirm" != "--confirm" ]]; then
  cat <<'WARN'

This rsyncs local storage/app/public → VPS (overwrites same paths on server).

  ./deploy/db/sync-storage-to-vps.sh --confirm

WARN
  exit 1
fi

if [[ ! -d "$LOCAL_STORAGE" ]]; then
  echo "Local storage not found: $LOCAL_STORAGE"
  exit 1
fi

echo "==> Syncing storage files to $SSH_HOST"
rsync -avz --delete "$LOCAL_STORAGE/" "${SSH_HOST}:${REMOTE_STORAGE}/"

echo "==> Fixing permissions on VPS"
ssh "$SSH_HOST" "sudo chown -R www-data:www-data '$REMOTE_STORAGE' && sudo find '$REMOTE_STORAGE' -type d -exec chmod 755 {} + && sudo find '$REMOTE_STORAGE' -type f -exec chmod 644 {} +"

echo "==> Done."

#!/usr/bin/env bash
# Push local PostgreSQL database to production VPS (full replace).
# WARNING: Overwrites all production data with your local database.
set -euo pipefail

SSH_HOST="${SSH_HOST:-alphabridge-ts}"
REMOTE_APP="${REMOTE_APP:-/var/www/school_management_system}"
LOCAL_DB="${LOCAL_DB:-school_management}"
REMOTE_DB="${REMOTE_DB:-school_management}"
REMOTE_DB_USER="${REMOTE_DB_USER:-school_user}"
PG_BIN="${PG_BIN:-/usr/local/opt/postgresql@16/bin}"
export PATH="$PG_BIN:$PATH"

confirm="${1:-}"

if [[ "$confirm" != "--confirm" ]]; then
  cat <<'WARN'

⚠️  FULL DATABASE REPLACE — local → VPS

This will:
  1. Back up production PostgreSQL to /var/backups/school_management/
  2. Replace the VPS database with your LOCAL copy
  3. Clear Laravel config/cache on the server

Production data (institutions, users, etc.) will be LOST unless restored from backup.

Run with --confirm when you are sure:

  ./deploy/db/sync-to-vps.sh --confirm

WARN
  exit 1
fi

if ! command -v pg_dump >/dev/null; then
  echo "pg_dump not found. Install: brew install postgresql@16"
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP_LOCAL="/tmp/school_management-${STAMP}.dump"
DUMP_REMOTE="/tmp/school_management-${STAMP}.dump"

echo "==> Dumping local database ($LOCAL_DB)"
pg_dump -Fc "$LOCAL_DB" -f "$DUMP_LOCAL"
echo "    $(du -h "$DUMP_LOCAL" | cut -f1) → $DUMP_LOCAL"

echo "==> Uploading dump to $SSH_HOST"
scp "$DUMP_LOCAL" "${SSH_HOST}:${DUMP_REMOTE}"

echo "==> Restoring on VPS (with production backup first)"
ssh "$SSH_HOST" bash -s <<REMOTE
set -euo pipefail
BACKUP_DIR="/var/backups/school_management"
sudo mkdir -p "\$BACKUP_DIR"
BACKUP="\${BACKUP_DIR}/pre-sync-${STAMP}.sql.gz"
echo "    Backing up production → \$BACKUP"
sudo -u postgres pg_dump "$REMOTE_DB" | gzip > "\$BACKUP"
echo "    Backup size: \$(du -h "\$BACKUP" | cut -f1)"

echo "    Dropping and recreating database (avoids FK errors from pg_restore --clean)..."
sudo -u postgres psql -d postgres -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$REMOTE_DB' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS $REMOTE_DB;
CREATE DATABASE $REMOTE_DB OWNER $REMOTE_DB_USER;
SQL

echo "    Restoring dump into empty database..."
sudo -u postgres pg_restore --no-owner --role="$REMOTE_DB_USER" -d "$REMOTE_DB" "$DUMP_REMOTE"

sudo -u postgres psql -d "$REMOTE_DB" -v ON_ERROR_STOP=1 -c "
GRANT ALL ON SCHEMA public TO $REMOTE_DB_USER;
GRANT ALL ON ALL TABLES IN SCHEMA public TO $REMOTE_DB_USER;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO $REMOTE_DB_USER;
"

cd "$REMOTE_APP/backend-laravel"
php artisan config:clear
php artisan cache:clear
php artisan route:clear

echo "    Production row counts:"
php artisan tinker --execute="echo \"institutions=\".\\App\\Institution::count().\" programmes=\".\\App\\Programme::count().\" users=\".\\App\\User::count();"

rm -f "$DUMP_REMOTE"
REMOTE

rm -f "$DUMP_LOCAL"
echo "==> Sync complete."

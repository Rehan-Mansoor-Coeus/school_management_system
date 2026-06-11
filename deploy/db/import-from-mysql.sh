#!/usr/bin/env bash
# One-time / refresh: copy local MySQL school_management into local PostgreSQL.
# Requires: postgresql@16 (brew), pgloader, MySQL with school_management database.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND="$ROOT/backend-laravel"
PG_BIN="${PG_BIN:-/usr/local/opt/postgresql@16/bin}"
export PATH="$PG_BIN:$PATH"

MYSQL_URL="${MYSQL_URL:-mysql://root:root@127.0.0.1/school_management}"
PG_DB="${PG_DB:-school_management}"
PGLOADER="${PGLOADER:-pgloader}"

if ! command -v "$PGLOADER" >/dev/null; then
  echo "pgloader not found. Install: brew install pgloader"
  exit 1
fi

if ! command -v psql >/dev/null; then
  echo "psql not found. Install: brew install postgresql@16"
  exit 1
fi

echo "==> Backing up Laravel .env (if not already backed up)"
if [[ -f "$BACKEND/.env" && ! -f "$BACKEND/.env.mysql.backup" ]]; then
  cp "$BACKEND/.env" "$BACKEND/.env.mysql.backup"
fi

echo "==> Dropping and recreating PostgreSQL database: $PG_DB"
dropdb --if-exists "$PG_DB"
createdb "$PG_DB"

echo "==> Loading MySQL → PostgreSQL via pgloader"
"$PGLOADER" "$MYSQL_URL" "postgresql:///$PG_DB"

echo "==> Moving tables and enum types from schema school_management → public"
psql "$PG_DB" <<'SQL'
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'school_management' ORDER BY tablename
  LOOP
    EXECUTE format('ALTER TABLE school_management.%I SET SCHEMA public', r.tablename);
  END LOOP;
END $$;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT t.typname
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'school_management' AND t.typtype = 'e'
  LOOP
    EXECUTE format('ALTER TYPE school_management.%I SET SCHEMA public', r.typname);
  END LOOP;
END $$;

DROP SCHEMA IF EXISTS school_management;
SQL

echo "==> Converting timestamptz columns (fixes Laravel 'Trailing data' on save)"
psql "$PG_DB" -t -A -f "$(dirname "$0")/fix-timestamp-columns.sql" | psql "$PG_DB" -v ON_ERROR_STOP=1

echo "==> Fixing renamed migration records (MySQL → renamed files on disk)"
psql "$PG_DB" <<'SQL'
UPDATE migrations
SET migration = '2026_05_26_000030_create_legacy_library_books_table'
WHERE migration = '2026_05_26_000030_create_library_books_table';

INSERT INTO migrations (migration, batch)
SELECT '2026_05_26_000003_extend_users_table_for_school', COALESCE(MAX(batch), 0)
FROM migrations
WHERE NOT EXISTS (
  SELECT 1 FROM migrations WHERE migration = '2026_05_26_000003_extend_users_table_for_school'
);
SQL

echo "==> Running pending Laravel migrations"
cd "$BACKEND"
php artisan migrate --force

echo "==> Done. Row counts:"
php artisan tinker --execute="echo \"institutions=\".\\App\\Institution::count().\" programmes=\".\\App\\Programme::count().\" users=\".\\App\\User::count();"

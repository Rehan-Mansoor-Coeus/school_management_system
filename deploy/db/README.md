# Database: local PostgreSQL + VPS sync

This project uses **PostgreSQL** locally and on production (okusoma.com VPS).  
Other apps on your Mac can stay on MySQL — only this project's `backend-laravel/.env` points at PostgreSQL.

## Local setup (one time)

```bash
brew install postgresql@16 pgloader
brew services start postgresql@16
```

Ensure MySQL still has your data (`school_management`, user `root`/`root`), then import:

```bash
chmod +x deploy/db/import-from-mysql.sh deploy/db/sync-to-vps.sh
./deploy/db/import-from-mysql.sh
```

Update `backend-laravel/.env`:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=school_management
DB_USERNAME=<your-mac-username>
DB_PASSWORD=
```

A copy of the old MySQL settings is kept at `backend-laravel/.env.mysql.backup`.

Verify:

```bash
cd backend-laravel
php artisan tinker --execute="echo App\\Institution::count();"
```

## Push local DB → VPS

**This replaces all production data** with your local database.

1. Develop and test locally against PostgreSQL.
2. Commit and deploy code separately (git push / VPS pull) if needed.
3. Sync the database:

```bash
./deploy/db/sync-to-vps.sh --confirm
```

The script will:

- `pg_dump -Fc` your local `school_management` database
- Back up production to `/var/backups/school_management/pre-sync-<timestamp>.sql.gz`
- Drop and recreate the VPS database, then `pg_restore` (avoids FK errors from `--clean`)
- Run `php artisan config:clear` and `cache:clear`

### Restore production from backup

If something goes wrong:

```bash
ssh alphabridge-ts
sudo gunzip -c /var/backups/school_management/pre-sync-YYYYMMDD-HHMMSS.sql.gz | sudo -u postgres psql school_management
```

Or use a plain SQL backup:

```bash
sudo -u postgres psql school_management < /path/to/backup.sql
```

## Manual commands

**Re-import from MySQL** (refresh local PG from MySQL source):

```bash
./deploy/db/import-from-mysql.sh
```

**Local dump only:**

```bash
pg_dump -Fc school_management -f /tmp/school_management.dump
```

**VPS connection:** SSH alias `alphabridge-ts`, app at `/var/www/school_management_system`, DB user `school_user`.

## Notes

- pgloader loads into a `school_management` schema first; `import-from-mysql.sh` moves everything to `public` (what Laravel expects).
- pgloader also creates `timestamptz` columns with abbreviated offsets (`+01`). The import script converts these to `timestamp(0) without time zone` so Laravel saves work. If you see **"Trailing data"** on login or save, run:

```bash
psql school_management -t -A -f deploy/db/fix-timestamp-columns.sql | psql school_management
```
- Do **not** use `DROP SCHEMA school_management CASCADE` after moving tables — it destroys enum types still referenced by `public` tables.
- MySQL-only migration syntax (`MODIFY COLUMN`, etc.) means `migrate:fresh` on PostgreSQL may still fail; use pgloader from MySQL or pg_dump from an existing PG copy instead.

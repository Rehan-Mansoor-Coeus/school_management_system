# AGENTS.md

## Cursor Cloud specific instructions

This repo has two apps:

- `backend-laravel/` — Laravel 6 API (PHP 8.0, MySQL).
- `frontend-react/` — React + Vite admin dashboard (Node 22).

The update script (run automatically on VM startup) installs PHP/JS dependencies
only. Everything below is what a future agent still needs to know to run, test,
and develop the apps.

### Runtime prerequisites already provisioned in the snapshot

- PHP 8.0 (`php8.0` from the `ondrej/php` PPA) + Composer. PHP 8.0 is used
  deliberately: most locked Composer packages require `^8.0` and break on newer
  PHP.
- MySQL 8 server. The `laravel` database, schema, and seed data persist in the
  snapshot, and `root` can log in over TCP (`127.0.0.1`) with an empty password,
  matching `backend-laravel/.env`.
- `backend-laravel/.env` already exists with a generated `APP_KEY` and MySQL
  config. It is git-ignored, so it persists via the snapshot but is never
  committed.

### Starting services (not done by the update script)

- Start MySQL first (it does not auto-start on a fresh VM):
  `sudo service mysql start`
- Backend API: from `backend-laravel/`, `php artisan serve --host 0.0.0.0 --port 8000`.
- Frontend: from `frontend-react/`, `npm run dev` (Vite on port 5173, proxies
  `/api` and `/storage` to the backend on `127.0.0.1:8000`).

### Default seeded login

- Admin: `admin@test.com` / `admin123` (other roles: `teacher@test.com`/`teacher123`,
  `student@test.com`/`student123`, etc.).
- The login API field is `login` (email, username, or phone), not `email`.

### Database setup gotcha (first-time / re-seed only)

- Migrations contain raw MySQL `ALTER TABLE ... MODIFY ... ENUM` statements, so
  MySQL is required; SQLite/Postgres `migrate:fresh` will not work for the full
  schema (PHPUnit tests use a separate SQLite `:memory:` config and are fine).
- The default seeder ordering is buggy: `RolePermissionSeeder` assigns the
  `view_library_menu` permission before `LibraryPermissionSeeder` creates it, so
  a bare `php artisan db:seed` fails on a clean DB. Seed the library permissions
  first, then run the full seed:
  `php artisan db:seed --class=LibraryPermissionSeeder --force` then
  `php artisan db:seed --force`.

### Tests / build / lint

- Backend tests: from `backend-laravel/`, `./vendor/bin/phpunit` (uses SQLite
  in-memory; the deprecated-schema warning is harmless).
- Frontend build: from `frontend-react/`, `npm run build`.
- There is no configured lint task for either app (backend uses remote StyleCI
  via `.styleci.yml`; frontend has no lint script).

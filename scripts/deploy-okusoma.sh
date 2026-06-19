#!/usr/bin/env bash
# Full production deploy for okusoma.com: backend migrations, ensure admin, frontend build + publish.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/frontend-react/dist"
WEB_ROOT="${WEB_ROOT:-/var/www/okusoma}"

echo "==> Backend: migrate"
(cd "$ROOT/backend-laravel" && php artisan migrate --force)

echo "==> Backend: ensure system admin can sign in"
(cd "$ROOT/backend-laravel" && php artisan system:ensure-admin --restore)

echo "==> Backend: cache config"
(cd "$ROOT/backend-laravel" && php artisan config:cache)

echo "==> Frontend: build"
(cd "$ROOT/frontend-react" && npm run build)

echo "==> Frontend: publish $DIST -> $WEB_ROOT"
rsync -a --delete "$DIST/" "$WEB_ROOT/"

echo "==> Reload services"
systemctl reload php7.4-fpm 2>/dev/null || systemctl reload php8.2-fpm 2>/dev/null || true
systemctl reload nginx 2>/dev/null || true

echo "Done. Login test:"
curl -s -X POST "https://okusoma.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"login":"admin@test.com","password":"admin123"}' | head -c 120
echo ""

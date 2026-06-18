#!/usr/bin/env bash
# Build the React app and publish static files to the nginx web root for okusoma.com.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/frontend-react/dist"
WEB_ROOT="${WEB_ROOT:-/var/www/okusoma}"

echo "Building frontend..."
(cd "$ROOT/frontend-react" && npm run build)

echo "Publishing $DIST -> $WEB_ROOT"
rsync -a --delete "$DIST/" "$WEB_ROOT/"

echo "Done. Verify: curl -s https://okusoma.com/ | grep index-"

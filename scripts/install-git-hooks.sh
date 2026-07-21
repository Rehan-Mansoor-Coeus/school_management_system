#!/usr/bin/env bash
# Install shared git hooks (copies into .git/hooks — no git config required).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOK_SRC="$ROOT/scripts/git-hooks/pre-push"
HOOK_DST="$ROOT/.git/hooks/pre-push"

if [ ! -d "$ROOT/.git/hooks" ]; then
  echo "Not a git checkout (missing .git/hooks)." >&2
  exit 1
fi

cp "$HOOK_SRC" "$HOOK_DST"
chmod +x "$HOOK_DST" "$ROOT/scripts/bump-version.sh"
echo "Installed pre-push hook -> $HOOK_DST"

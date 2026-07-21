#!/usr/bin/env bash
# Bump patch version in VERSION and frontend-react/package.json (e.g. 2.1.0 -> 2.1.1).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION_FILE="$ROOT/VERSION"
PKG_FILE="$ROOT/frontend-react/package.json"

current="$(tr -d '[:space:]' < "$VERSION_FILE")"
if [[ ! "$current" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
  echo "Invalid VERSION: $current (expected MAJOR.MINOR.PATCH)" >&2
  exit 1
fi

major="${BASH_REMATCH[1]}"
minor="${BASH_REMATCH[2]}"
patch="${BASH_REMATCH[3]}"
next="${major}.${minor}.$((patch + 1))"

printf '%s\n' "$next" > "$VERSION_FILE"

if command -v python3 >/dev/null 2>&1; then
  python3 - "$PKG_FILE" "$next" <<'PY'
import json, sys
path, version = sys.argv[1], sys.argv[2]
with open(path, encoding='utf-8') as f:
    data = json.load(f)
data['version'] = version
with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
PY
else
  # Fallback: replace "version": "..." on first match
  sed -i.bak -E "s/\"version\": \"[^\"]+\"/\"version\": \"${next}\"/" "$PKG_FILE"
  rm -f "${PKG_FILE}.bak"
fi

echo "$next"

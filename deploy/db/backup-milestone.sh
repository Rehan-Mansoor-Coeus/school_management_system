#!/usr/bin/env bash
# Snapshot database + storage + env at a release milestone.
# Usage:
#   Local:  ./deploy/db/backup-milestone.sh [label]
#   VPS:    ssh alphabridge-ts 'bash -s' < deploy/db/backup-milestone.sh vps v1.0.0
set -euo pipefail

TARGET="${1:-local}"
LABEL="${2:-$(cat VERSION 2>/dev/null || echo unknown)}"
STAMP="$(date +%Y%m%d-%H%M%S)"
SAFE_LABEL="$(echo "$LABEL" | tr '/ ' '-')"
PG_BIN="${PG_BIN:-/usr/local/opt/postgresql@16/bin}"
export PATH="$PG_BIN:$PATH"

if [[ "$TARGET" == "vps" ]]; then
  BACKUP_DIR="/var/backups/school_management/${SAFE_LABEL}-${STAMP}"
  APP="/var/www/school_management_system"
  sudo mkdir -p "$BACKUP_DIR"
  sudo -u postgres pg_dump school_management | gzip | sudo tee "${BACKUP_DIR}/school_management.sql.gz" > /dev/null
  sudo cp "${APP}/backend-laravel/.env" "${BACKUP_DIR}/backend.env.backup"
  sudo rsync -a "${APP}/backend-laravel/storage/app/public/" "${BACKUP_DIR}/storage-public/"
  cd "$APP" && git rev-parse HEAD | sudo tee "${BACKUP_DIR}/git-commit.txt" > /dev/null
  git branch --show-current 2>/dev/null | sudo tee -a "${BACKUP_DIR}/git-commit.txt" > /dev/null || true
  echo "VPS backup: ${BACKUP_DIR}"
  sudo du -sh "${BACKUP_DIR}"/*
  exit 0
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKUP_DIR="${ROOT}/backups/${SAFE_LABEL}-${STAMP}"
mkdir -p "$BACKUP_DIR"

pg_dump -Fc school_management -f "${BACKUP_DIR}/school_management.dump"
pg_dump school_management | gzip > "${BACKUP_DIR}/school_management.sql.gz"
cp "${ROOT}/backend-laravel/.env" "${BACKUP_DIR}/backend.env.backup"
rsync -a "${ROOT}/backend-laravel/storage/app/public/" "${BACKUP_DIR}/storage-public/"
cd "$ROOT" && { git rev-parse HEAD; git branch --show-current; } > "${BACKUP_DIR}/git-commit.txt"

echo "Local backup: ${BACKUP_DIR}"
du -sh "${BACKUP_DIR}"/*

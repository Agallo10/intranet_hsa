#!/usr/bin/env bash
# Backups de la intranet: base de datos PostgreSQL + archivos (uploads).
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
KEEP_DAYS="${KEEP_DAYS:-7}"

mkdir -p "${BACKUP_DIR}"

echo "==> Respaldo de la base de datos..."
docker compose exec -T postgres pg_dump -U intranet intranet \
  > "${BACKUP_DIR}/db-${TIMESTAMP}.sql"

echo "==> Respaldo de archivos (uploads)..."
docker compose exec -T backend tar -C /data -czf - uploads \
  > "${BACKUP_DIR}/uploads-${TIMESTAMP}.tar.gz"

echo "==> Limpiando backups con más de ${KEEP_DAYS} días..."
find "${BACKUP_DIR}" -type f -mtime "+${KEEP_DAYS}" -delete

echo "Backups creados en ${BACKUP_DIR}:"
ls -lh "${BACKUP_DIR}"

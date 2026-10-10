#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="${FINTRACK_ENV_FILE:-$project_dir/.env.production}"
backup_dir="${FINTRACK_BACKUP_DIR:-$project_dir/backups}"
umask 077
mkdir -p -- "$backup_dir"
stamp="$(date -u +%Y%m%dT%H%M%SZ)-$$"
backup_file="$backup_dir/fintrack-$stamp.dump"
container_file="/tmp/fintrack-$stamp.dump"
compose=(docker compose --env-file "$env_file" -f "$project_dir/compose.production.yml")
trap '"${compose[@]}" exec -T postgres rm -f -- "$container_file" >/dev/null 2>&1 || true' EXIT
"${compose[@]}" exec -T postgres sh -c 'pg_dump --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --format=custom --no-owner --file="$1"' sh "$container_file"
"${compose[@]}" cp "postgres:$container_file" "$backup_file"
chmod 600 -- "$backup_file"
"${compose[@]}" exec -T postgres pg_restore --list "$container_file" >/dev/null
test -s "$backup_file"
printf 'Backup concluido: %s\n' "$backup_file"

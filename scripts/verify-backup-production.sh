#!/usr/bin/env bash
set -euo pipefail
if [[ $# -ne 1 || ! -f "$1" ]]; then
  printf 'Uso: bash scripts/verify-backup-production.sh CAMINHO_DO_DUMP\n' >&2
  exit 1
fi
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="${FINTRACK_ENV_FILE:-$project_dir/.env.production}"
compose=(docker compose --env-file "$env_file" -f "$project_dir/compose.production.yml")
stamp="$(date -u +%Y%m%dT%H%M%SZ)_$$"
restore_db="fintrack_restore_${stamp,,}"
container_file="/tmp/$restore_db.dump"
created=false
cleanup() {
  if [[ "$created" == true ]]; then
    "${compose[@]}" exec -T postgres sh -c 'dropdb --username="$POSTGRES_USER" "$1"' sh "$restore_db"
  fi
  "${compose[@]}" exec -T postgres rm -f -- "$container_file"
}
trap cleanup EXIT
"${compose[@]}" cp "$1" "postgres:$container_file"
"${compose[@]}" exec -T postgres sh -c 'createdb --username="$POSTGRES_USER" "$1"' sh "$restore_db"
created=true
"${compose[@]}" exec -T postgres sh -c 'pg_restore --username="$POSTGRES_USER" --dbname="$1" --no-owner --no-privileges --exit-on-error "$2"' sh "$restore_db" "$container_file"
"${compose[@]}" exec -T postgres sh -c 'psql --username="$POSTGRES_USER" --dbname="$1" --set=ON_ERROR_STOP=1 --command="SELECT count(*) AS migrations FROM flyway_schema_history WHERE success; SELECT count(*) AS usuarios FROM usuarios;"' sh "$restore_db"
printf 'Backup restaurado e conferido em banco temporario.\n'

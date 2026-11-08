#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

production_dir="${GET_SOSED_PRODUCTION_DIR:-/home/ubuntu/get-sosed-production}"
client_image="${1:-}"
server_image="${2:-}"

if [[ ! "$client_image" =~ ^ghcr\.io/buianto-03/get-sosed-client@sha256:[0-9a-f]{64}$ ]] ||
   [[ ! "$server_image" =~ ^ghcr\.io/buianto-03/get-sosed-server@sha256:[0-9a-f]{64}$ ]]; then
  echo 'Нужны проверенные digest образов клиента и сервера.' >&2
  exit 1
fi

cd "$production_dir"
exec 9>.deploy.lock
if ! flock -n 9; then
  echo 'Другой деплой уже выполняется.' >&2
  exit 1
fi

temp_dir="$(mktemp -d)"
next_env="$(mktemp "$production_dir/.production.env.deploy.XXXXXX")"
backup_temp=''
cleanup() {
  rm -rf -- "$temp_dir"
  rm -f -- "$next_env"
  if [[ -n "$backup_temp" ]]; then
    rm -f -- "$backup_temp"
  fi
}
trap cleanup EXIT
export DOCKER_CONFIG="$temp_dir/docker"
mkdir -p "$DOCKER_CONFIG"
unset CLIENT_IMAGE SERVER_IMAGE

python3 - "$production_dir/production.env" "$next_env" "$client_image" "$server_image" <<'PY'
import pathlib
import sys

source, destination, client, server = sys.argv[1:]
lines = pathlib.Path(source).read_text(encoding='utf-8').splitlines(keepends=True)
values = {'CLIENT_IMAGE': client, 'SERVER_IMAGE': server}
counts = dict.fromkeys(values, 0)
for index, line in enumerate(lines):
    key = line.split('=', 1)[0]
    if key in values:
        counts[key] += 1
        lines[index] = f'{key}={values[key]}\n'
if any(count != 1 for count in counts.values()):
    raise SystemExit('В production.env должны быть по одной строке CLIENT_IMAGE и SERVER_IMAGE')
pathlib.Path(destination).write_text(''.join(lines), encoding='utf-8')
PY
chmod --reference=production.env "$next_env"
chown --reference=production.env "$next_env"

compose=(docker compose --env-file "$next_env" --file compose.production.yaml)
"${compose[@]}" config --quiet

echo 'Получаем доступ к реестру и загружаем образы.'
token="$(/usr/local/bin/aws ssm get-parameter \
  --region eu-central-1 \
  --name /get-sosed/production/ghcr-read-token \
  --with-decryption --query 'Parameter.Value' --output text)"
if [[ -z "$token" || "$token" == 'None' ]]; then
  echo 'Токен GHCR отсутствует.' >&2
  exit 1
fi
printf '%s' "$token" | docker login ghcr.io --username Buianto-03 --password-stdin
unset token
"${compose[@]}" pull client server

echo 'Проверяем базу и сохраняем резервную копию.'
"${compose[@]}" exec -T db sh -c 'exec pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
mkdir -p backups
backup_temp="$(mktemp "$production_dir/backups/.db-pre-deploy.XXXXXX")"
"${compose[@]}" exec -T db sh -c 'exec pg_dump --format=custom --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"' > "$backup_temp"
backup_path="$production_dir/backups/db-pre-deploy-$(date -u +%Y%m%dT%H%M%SZ)-$(basename "$backup_temp").dump"
mv -- "$backup_temp" "$backup_path"
backup_temp=''
echo "Резервная копия базы: $backup_path"

echo 'Применяем миграции.'
"${compose[@]}" run --rm --no-deps --pull never migrate

echo 'Обновляем конфигурацию образов и контейнеры.'
mv -- "$next_env" "$production_dir/production.env"
compose=(docker compose --env-file "$production_dir/production.env" --file compose.production.yaml)
"${compose[@]}" up --detach --no-deps --pull never server client

echo 'Проверяем API.'
for attempt in {1..30}; do
  if curl --fail --silent --show-error --max-time 5 --output /dev/null http://127.0.0.1:8082/api/adverts; then
    echo 'Деплой завершён, API отвечает.'
    exit 0
  fi
  sleep 2
done
echo 'API не ответил после обновления. Проверьте контейнеры и журнал деплоя.' >&2
exit 1

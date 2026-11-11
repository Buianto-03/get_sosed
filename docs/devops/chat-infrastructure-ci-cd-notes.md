# Конспект чата: production, Docker, CI/CD, Яндекс Карты и сиды

Конспект фиксирует результат чата по состоянию на 9 ноября 2026 года. Он
составлен по сообщениям, показанным результатам команд, истории Git и текущим
файлам проекта. Это учебная запись: команды из разных разделов не нужно
выполнять подряд.

Содержание:

1. [Результаты работ](#1-что-получилось-в-результате).
2. [Архитектура и файлы инфраструктуры](#2-где-что-находится-и-как-проходит-запрос).
3. [HTTPS и загрузка файлов](#3-https-и-исправление-загрузки-файлов).
4. [GHCR, digest и обновление клиента](#4-ghcr-digest-и-ручное-обновление-клиента).
5. [Резервные копии и восстановление](#5-резервные-копии-и-пробное-восстановление).
6. [AWS, SSM и OIDC](#6-aws-systems-manager-и-подключение-github-через-oidc).
7. [CI и сохранение digest](#7-ci-проверки-публикация-образов-и-сохранение-digest).
8. [Ручной деплой](#8-ручной-деплой-где-и-когда-запускается-обновление).
9. [Конструкции Bash](#9-разбор-служебных-конструкций-серверного-скрипта).
10. [Яндекс Карты](#10-яндекс-карты-причина-и-сохранённые-изменения).
11. [Модели, миграции и сиды](#11-проверка-моделей-миграций-и-всех-сидов).
12. [Разовый архив и подготовленные команды сброса](#12-итоговый-вариант-разового-переноса-базы-и-фотографий).
13. [Git и основные коммиты](#13-git-как-сохранялись-и-проверялись-изменения).
14. [Предложенные дальнейшие работы](#14-что-обсуждалось-как-дальнейшая-работа).
15. [Как понимать результаты команд](#15-как-читать-результаты-команд).

В тексте используются три статуса:

- **Выполнено** — есть результат команды, скриншот или подтверждение в чате.
- **Проверено локально** — проверка выполнена на Mac или в отдельных тестовых
  контейнерах; она не означает изменение production.
- **Подготовлено** — файл, архив или инструкция готовы, но выполнения на EC2
  в истории чата ещё нет.

## 1. Что получилось в результате

| Работа | Подтверждённый результат |
| --- | --- |
| HTTPS через Caddy | Сайт открылся по `https://get-sosed.duckdns.org` |
| Исправление HTTP 413 | Лимит тела запроса Nginx увеличен до `20m`; обновлённый клиент установлен на EC2; загрузка подтверждена пользователем |
| Резервные копии | Дамп БД и архив фото скопированы на Mac; контрольные суммы совпали; восстановление проверено отдельно |
| GitHub → AWS | Настроены SSM и OIDC; проверка подключения прошла |
| Ручной production-деплой | Успешно выполнен из GitHub Actions через SSM |
| Выбор CI для деплоя | ID можно не вводить: выбирается успешный CI для точного коммита запуска |
| Яндекс Карты | Найдена причина отсутствия карты; передача ключа в сборку реализована и проверена с тестовым значением |
| Сиды | Исправлены теги и связи; полный набор проверен на новой PostgreSQL 16 |
| Разовый перенос сидов и фото | Подготовлен и локально проверен отдельный архив |
| Сброс production-базы из этого архива | **Ещё не подтверждён и ассистентом не выполнялся** |

Отказ от последнего дампа был согласован именно для предстоящего разового
сброса. Обычный скрипт деплоя продолжает делать локальный дамп перед миграциями.

## 2. Где что находится и как проходит запрос

| Место | Назначение |
| --- | --- |
| Mac: `/Users/buantosagdurov/Desktop/github/get-sosed` | Рабочий репозиторий |
| EC2: `/home/ubuntu/get-sosed-production` | Production Compose, Caddyfile, `production.env`, backups |
| GitHub: `Buianto-03/get-sosed` | Код, CI, ручной запуск деплоя |
| GHCR: `ghcr.io/buianto-03/…` | Опубликованные образы клиента и сервера |
| AWS Region: `eu-central-1` | Регион Frankfurt, использованный при настройке |
| EC2: `i-097ccdb2860f9a12b` | Инстанс, указанный при настройке SSM |

Схема HTTP-запроса:

```text
Браузер → HTTPS :443 → Caddy → client:80 (Nginx)
                                    ├─ страницы и JavaScript React
                                    ├─ /api/ → server:3000 → PostgreSQL
                                    ├─ /images/ → server:3000 → volume изображений
                                    └─ /ws → WebSocket сервера
```

`client`, `server`, `db`, `migrate`, `caddy` — имена сервисов Compose. Они
используются в командах и во внутренней Docker-сети. Имя контейнера, например
`get-sosed-production-client-1`, — отдельное понятие.

### Сохранённые файлы инфраструктуры

| Файл | Назначение и изменения |
| --- | --- |
| [Caddyfile](/Users/buantosagdurov/Desktop/github/get-sosed/Caddyfile) | Домен и `reverse_proxy client:80` |
| [compose.production.yaml](/Users/buantosagdurov/Desktop/github/get-sosed/compose.production.yaml) | Production-сервисы, образы, переменные, порты, volumes |
| [.gitignore](/Users/buantosagdurov/Desktop/github/get-sosed/.gitignore) | Добавлено правило игнорирования `production.env`, чтобы файл с production-настройками не попал в Git |
| [client/nginx.conf](/Users/buantosagdurov/Desktop/github/get-sosed/client/nginx.conf) | Добавлен `client_max_body_size 20m;` |
| [server/Dockerfile](/Users/buantosagdurov/Desktop/github/get-sosed/server/Dockerfile) | В итоговом образе есть compiled server, конфигурация Sequelize, миграции и сид ролей |

Production Compose сохраняет PostgreSQL в `production_db_data`, пользовательские
фото — в `production_uploads`, данные Caddy — в `caddy_data` и `caddy_config`.
Фактические Docker-имена named volumes обычно дополнены именем Compose-проекта.
Отдельное удаление БД внутри PostgreSQL не удаляет эти volumes.

## 3. HTTPS и исправление загрузки файлов

### 3.1. Запуск Caddy

**Выполнено на EC2:**

```bash
sudo docker compose \
  --env-file production.env \
  --file compose.production.yaml \
  up --detach caddy
```

| Часть команды | Значение |
| --- | --- |
| `sudo` | Выполнить команду с правами root |
| `docker compose` | Управление приложением из Compose-конфигурации |
| `--env-file production.env` | Файл переменных для подстановки в Compose |
| `--file …`, сокращённо `-f` | Выбрать Compose-файл |
| `up` | Создать или обновить контейнеры и запустить сервис |
| `--detach`, сокращённо `-d` | Оставить сервис работать в фоне |
| `caddy` | Применить команду к этому сервису |

Caddy обслуживает домен и автоматизирует получение и обновление TLS-сертификатов
при выполнении требований к DNS и доступности портов. В чате подтверждено
открытие сайта по HTTPS. [Документация Caddy](https://caddyserver.com/docs/automatic-https).

### 3.2. Ошибка HTTP 413

При создании объявления с тремя файлами, один из которых имел размер около
1,3 МБ, возникала ошибка `413 Request Entity Too Large`. В конфигурацию Nginx
добавили:

```nginx
client_max_body_size 20m;
```

Это лимит **всего тела HTTP-запроса**, включая все файлы и multipart-данные.
Он не отменяет отдельные ограничения размера и числа файлов в приложении.

**Локальная сборка образа для проверки:**

```bash
docker build \
  --tag get-sosed-client:upload-check \
  --file client/Dockerfile \
  client
```

- `build` — собрать образ.
- `--tag`, сокращённо `-t`, — назначить образу имя и тег.
- `--file`, сокращённо `-f`, — выбрать Dockerfile.
- Последний аргумент `client` — build context: каталог файлов, доступных сборке.

**Проверка конфигурации Nginx:**

```bash
docker run --rm \
  --add-host server:127.0.0.1 \
  get-sosed-client:upload-check \
  nginx -t
```

- `run` — создать и запустить контейнер из образа.
- `--rm` — удалить контейнер после завершения; образ не удаляется.
- `--add-host` — добавить запись в hosts внутри контейнера. Здесь она позволяет
  Nginx разрешить имя `server` при автономной проверке.
- `nginx -t` — проверить синтаксис и необходимые файлы конфигурации. Флаг `-t`
  здесь принадлежит Nginx, а не Docker.

Результат: `syntax is ok`, `test is successful`.

**Запуск временного контейнера и проверка запроса размером 2 MiB:**

```bash
docker run --detach --rm \
  --name get-sosed-upload-check \
  --add-host server:127.0.0.1 \
  --publish 127.0.0.1:18083:80 \
  get-sosed-client:upload-check

head -c 2097152 /dev/zero | curl \
  --silent --show-error \
  --output /dev/null \
  --write-out 'HTTP %{http_code}\n' \
  --data-binary @- \
  http://127.0.0.1:18083/api/adverts

docker stop get-sosed-upload-check
```

| Флаг или конструкция | Значение |
| --- | --- |
| Docker `--name` | Назначить имя контейнеру |
| Docker `--publish 127.0.0.1:18083:80` | Порт 80 контейнера доступен на локальном порту 18083 Mac, только через loopback |
| `head -c 2097152` | Прочитать ровно указанное количество байт |
| `/dev/zero` | Источник нулевых байтов для тестового тела |
| `\|` | Передать stdout первой команды в stdin второй |
| curl `--silent` | Убрать индикатор прогресса |
| `--show-error` | Показывать ошибки даже с `--silent` |
| `--output /dev/null` | Не сохранять тело ответа |
| `--write-out` | Вывести метаданные запроса; `%{http_code}` — HTTP-статус |
| `--data-binary @-` | Отправить тело из stdin без преобразования |
| `docker stop` | Остановить контейнер; из-за `--rm` он затем удаляется |

В тесте вернулся `502`: лимит Nginx не отклонил запрос как `413`, но реального
backend в этом автономном контейнере не было. Это не был успешный тест
публикации объявления. После обновления production-клиента пользователь
подтвердил, что загрузка получилась.

## 4. GHCR, digest и ручное обновление клиента

### 4.1. Вход в GHCR без токена в аргументах

**Выполнено на EC2:**

```bash
read -r -s -p "GitHub token: " GHCR_TOKEN
printf '\n'
printf '%s' "$GHCR_TOKEN" | sudo docker login ghcr.io \
  --username Buianto-03 \
  --password-stdin
unset GHCR_TOKEN
```

| Часть | Значение |
| --- | --- |
| `read` | Прочитать ввод в переменную |
| `-r` | Не интерпретировать обратные слеши как escape-последовательности |
| `-s` | Не показывать вводимые символы |
| `-p` | Показать приглашение ко вводу |
| `printf '\n'` | Перейти на новую строку после скрытого ввода |
| `printf '%s' "$GHCR_TOKEN"` | Передать значение как строку, не интерпретируя его как формат |
| `--username` | Имя пользователя реестра |
| `--password-stdin` | Прочитать пароль или токен из стандартного ввода |
| `unset` | Удалить переменную из текущей shell-сессии |

Мнемоника: `stdin` = **standard input**, стандартный ввод. Поэтому
`--password-stdin` означает «получи пароль из входного потока».

Результат — `Login Succeeded`. Docker предупредил о хранении credentials в
`/root/.docker/config.json`. Без credential helper это не зашифрованное
хранилище. `unset` удаляет shell-переменную, но не Docker credentials.
[Документация Docker Login](https://docs.docker.com/reference/cli/docker/login/).

После скачивания образа выполнили:

```bash
sudo docker logout ghcr.io
```

Команда удаляет сохранённые credentials для этого реестра; уже скачанный образ
остаётся доступным.

### 4.2. Зачем нужен digest

Тег — имя версии, которое может начать указывать на другой образ. Digest
идентифицирует конкретное содержимое manifest или индекса образа. В `production.env`
использовалась запись вида:

```text
CLIENT_IMAGE=ghcr.io/buianto-03/get-sosed-client@sha256:<64 hex-символа>
```

Исторический пример образа, скачанного в чате; это не указание версии для
будущего обновления:

```bash
sudo docker pull \
  ghcr.io/buianto-03/get-sosed-client@sha256:582cdc1a2e6770ec2472a8beef2f00b4bad49bb37bd376afd09bbb0c8c69d949
```

`pull` скачивает образ. Оно не переключает уже работающий контейнер.

После замены `CLIENT_IMAGE` в `production.env` применили:

```bash
sudo docker compose --env-file production.env \
  -f compose.production.yaml \
  up -d --no-deps --pull never client

sudo docker compose --env-file production.env \
  -f compose.production.yaml ps client
```

- `--no-deps` — не запускать зависимости выбранного сервиса.
- `--pull never` — не скачивать образ; использовать уже имеющийся локально.
- `ps client` — показать состояние контейнера сервиса `client`.
- `up` при изменении образа или конфигурации пересоздаёт соответствующий
  контейнер, сохраняя подключённые volumes.

В выводе подтвердились нужный digest, статус `Up` и привязка
`127.0.0.1:8082 → 80`. [Поведение Compose Up](https://docs.docker.com/reference/cli/docker/compose/up/).

## 5. Резервные копии и пробное восстановление

### 5.1. Что фактически проверили

На EC2 были получены дамп `db-20261107-160217.dump` и архив
`uploads-20261107-160308.tar.gz`. Копии перенесли на Mac в
`/Users/buantosagdurov/get-sosed-backups`.

SHA-256 дампа и архива на Mac совпали с SHA-256 файлов на EC2. Архив фотографий
успешно прочитан и распакован. Дамп восстановлен в отдельную проверочную базу.
В основной и восстановленной базе совпали счётчики: **1 пользователь,
2 объявления, 8 фотографий**. В распакованном архиве было 8 файлов; пользователь
подтвердил отображение фотографии.

### 5.2. Команды создания копий

Ниже — примеры повторения этих операций с текущими сервисами Compose, а не
утверждение о дословной исторической команде создания архивов.

```bash
sudo docker compose --env-file production.env -f compose.production.yaml \
  exec -T db sh -c \
  'exec pg_dump --format=custom --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"' \
  > backups/db-example.dump

sudo docker compose --env-file production.env -f compose.production.yaml \
  exec -T server tar -czf - -C /app/public/images . \
  > backups/uploads-example.tar.gz
```

| Часть | Значение |
| --- | --- |
| Compose `exec` | Выполнить команду внутри уже запущенного контейнера |
| `-T`, также `--no-TTY` | Отключить псевдотерминал; удобно для дампов и перенаправления данных |
| `sh -c` | Выполнить строку команд оболочкой внутри контейнера |
| Внутренний `exec pg_dump` | Заменить shell-процесс процессом `pg_dump` |
| `pg_dump --format=custom` | Сформировать custom-архив PostgreSQL для последующего `pg_restore` |
| PostgreSQL `--username`, `--dbname` | Роль подключения и база |
| `>` | Записать stdout в файл на хосте; существующий файл с таким именем перезаписывается |
| `tar -c` | Создать архив |
| `tar -z` | Использовать gzip |
| `tar -f -` | Вывести архив в stdout, обозначенный `-` |
| `tar -C /app/public/images` | Перейти в этот каталог перед сбором файлов |
| Завершающая `.` | Включить содержимое текущего каталога |

Дамп БД и архив файлов — разные копии. `pg_dump` не сохраняет фотографии из
Docker volume. Он формирует согласованный снимок одной БД, но последовательное
создание двух архивов само по себе не даёт общего атомарного снимка БД и файлов.
[Документация pg_dump](https://www.postgresql.org/docs/16/app-pgdump.html).

### 5.3. Целостность файлов

**Команды из проверки:**

```bash
# EC2
sha256sum \
  ~/get-sosed-production/backups/db-20261107-160217.dump \
  ~/get-sosed-production/backups/uploads-20261107-160308.tar.gz

# Mac
shasum -a 256 \
  ~/get-sosed-backups/db-20261107-160217.dump \
  ~/get-sosed-backups/uploads-20261107-160308.tar.gz

tar -tzf ~/get-sosed-backups/uploads-20261107-160308.tar.gz > /dev/null
echo $?

find ~/get-sosed-backups/uploads-restore-check-20261107 -type f | wc -l
```

- `sha256sum` — вычислить SHA-256 файла.
- `shasum -a 256` — выбрать алгоритм SHA-256 в утилите macOS.
- `tar -t` — прочитать список содержимого архива; `-z` и `-f` описаны выше.
- `echo $?` — показать exit code **непосредственно предыдущей** команды;
  получен `0`, то есть успешное завершение.
- `find … -type f` — найти обычные файлы.
- `wc -l` — посчитать строки вывода. В данном каталоге это дало 8 файлов.

### 5.4. Восстановление в отдельную базу

**Выполнено на EC2:**

```bash
sudo docker compose --env-file production.env --file compose.production.yaml \
  exec db createdb --username get_sosed --maintenance-db postgres \
  get_sosed_backup_check_20261107

sudo docker compose --env-file production.env --file compose.production.yaml \
  exec -T db pg_restore --username get_sosed \
  --dbname get_sosed_backup_check_20261107 --exit-on-error \
  < backups/db-20261107-160217.dump

sudo docker compose --env-file production.env --file compose.production.yaml \
  exec db psql --username get_sosed \
  --dbname get_sosed_backup_check_20261107 \
  --command 'SELECT (SELECT count(*) FROM "Users") AS users,
    (SELECT count(*) FROM "Adverts") AS adverts,
    (SELECT count(*) FROM "AdvertPhotos") AS photos;'
```

- `createdb` — создать новую базу.
- `--maintenance-db postgres` — подключиться к служебной базе для выполнения
  операции создания.
- `pg_restore` — восстановить PostgreSQL custom-архив.
- `--exit-on-error` — остановить восстановление при SQL-ошибке.
- `< файл` — передать файл в stdin команды; поэтому у `pg_restore` здесь нет
  аргумента с путём к файлу внутри контейнера.
- `psql --command`, сокращённо `-c`, — выполнить переданный SQL.
- `count(*)` — число строк таблицы; подзапросы позволяют показать три счётчика
  одной строкой.

Тот же SELECT выполнили для основной базы `get_sosed` и сравнили результаты.
Удаление проверочной базы после проверки в истории чата не подтверждено.
[Документация pg_restore](https://www.postgresql.org/docs/16/app-pgrestore.html).

## 6. AWS Systems Manager и подключение GitHub через OIDC

### 6.1. Что настроили в AWS

Работы выполнялись через AWS Console; успешные результаты были показаны
пользователем в чате:

1. EC2 подключили к Systems Manager. Создали и назначили instance role с
   `AmazonSSMManagedInstanceCore`; инстанс появился как managed node со статусом
   `Online`.
2. Настроили OIDC provider GitHub: `token.actions.githubusercontent.com`.
3. Создали роль `get-sosed-github-deploy`. Её ARN:
   `arn:aws:iam::767920142979:role/get-sosed-github-deploy`.
4. Для GitHub задали переменные `AWS_ROLE_ARN`, `AWS_REGION`, `EC2_INSTANCE_ID`.
5. На EC2 установили AWS CLI; версия была выведена успешно.
6. Токен чтения GHCR сохранили в Parameter Store как SecureString
   `/get-sosed/production/ghcr-read-token`. Доступ к нему и скачивание образа
   проверили на EC2.
7. Создали SSM document `GetSosed-DeployProduction` и дали deploy-роли права
   отправлять этот документ на нужный EC2 и читать результат выполнения.

OIDC позволяет GitHub получать временные AWS credentials через роль.
Долгоживущий AWS access key в workflow для этой схемы не нужен. Роль GitHub
и роль самого EC2 выполняют разные функции: первая отправляет команду SSM,
вторая позволяет EC2 работать с SSM и прочитать параметр GHCR.

### 6.2. Почему сначала не сработал OIDC

Первый запуск завершился ошибкой:

```text
Not authorized to perform sts:AssumeRoleWithWebIdentity
```

В [aws-connection-check.yaml](/Users/buantosagdurov/Desktop/github/get-sosed/.github/workflows/aws-connection-check.yaml)
добавили диагностику `sub` и `aud` из OIDC token. Полный token в лог не выводили.

Фактически GitHub прислал:

```text
aud = sts.amazonaws.com
sub = repo:Buianto-03@114070855/get-sosed@1376010153:ref:refs/heads/release/initial
```

В исходной trust policy было имя репозитория без частей `@<ID>`. После замены
условия на наблюдённый `sub` проверка прошла. Этот формат зафиксирован для
данного репозитория; его не нужно считать универсальной строкой для любого
GitHub-проекта.

Указание `release/initial` в trust policy ограничивает получение роли этой
веткой workflow. Это не произвольный выбор ветки образа для production.
Текущий workflow также отдельно проверяет branch и происхождение CI.

### 6.3. Проверочные команды AWS

После установки AWS CLI проверили её запуск:

```bash
aws --version
```

`--version` показывает версию установленного клиента. Эта команда сама по себе
не проверяет AWS credentials или доступ к инстансу.

**Выполнено workflow:**

```bash
aws sts get-caller-identity --query Account --output text
```

`get-caller-identity` возвращает сведения о действующем AWS-пользователе или
роли; `--query Account` выбирает поле Account через JMESPath;
`--output text` выводит текст вместо JSON.

**Фрагмент серверного скрипта — чтение токена в переменную:**

```bash
token="$(aws ssm get-parameter \
  --region eu-central-1 \
  --name /get-sosed/production/ghcr-read-token \
  --with-decryption \
  --query 'Parameter.Value' --output text)"
```

- `--region` — выбрать регион AWS.
- `--name` — имя параметра Parameter Store.
- `--with-decryption` — получить расшифрованное значение SecureString.
- `--query 'Parameter.Value'` — выбрать только значение параметра.
- `$(…)` — сохранить stdout команды в переменную. В скрипте токен затем
  передаётся в Docker через stdin и не печатается в лог.

Токен GHCR читает EC2. Workflow GitHub не скачивает этот токен к себе.
[AWS GetParameter](https://docs.aws.amazon.com/cli/latest/reference/ssm/get-parameter.html).

## 7. CI: проверки, публикация образов и сохранение digest

Файл: [ci.yaml](/Users/buantosagdurov/Desktop/github/get-sosed/.github/workflows/ci.yaml).

### 7.1. Итоговая цепочка

CI запускается на `push` и `pull_request`. В нём проверяются сервер, клиент,
сборка Docker-образов и работа приложения через Compose.

Публикация `publish-images` разрешена только для `push` в `release/initial`
после успешного завершения зависимых проверок. Перед публикацией образы
запускаются с временной PostgreSQL; проверяются миграции, сид ролей и API.

В итоговой версии CI применяется **только сид ролей**, а API возвращает пустой
список объявлений. Временное изменение CI для загрузки всех демонстрационных
сидов было отменено после выбора разового переноса отдельным архивом.

Основные команды npm и диагностики:

| Команда | Назначение и флаги |
| --- | --- |
| `npm ci` | Установить зависимости по lock-файлу; `ci` — отдельная команда npm, а не флаг |
| `npm run typecheck` | Запустить серверный script проверки TypeScript |
| `npm test` | Запустить тесты; серверный script сначала выполняет сборку |
| `npm run lint` | Проверить клиент ESLint и границы FSD |
| `npm run build` | Выполнить script сборки соответствующего пакета |
| `docker compose --profile tools config --quiet` | Активировать профиль `tools`, проверить итоговый Compose без печати конфигурации |
| `docker compose run --rm --build migrate` | Собрать образ и выполнить миграции в одноразовом контейнере |
| `docker compose up -d --build server` | Собрать и запустить сервер в фоне |
| `docker compose ps --all` | Показать также остановленные контейнеры |
| `docker compose logs --no-color --tail=50 db server client` | Последние 50 строк каждого сервиса без ANSI-цветов |

Для ожидания PostgreSQL используется `pg_isready`: `-U` — роль подключения,
`-d` — база. Эти флаги принадлежат PostgreSQL и не связаны с Compose `-d`.

Встроенные зависимости образа проверяются через:

```bash
docker run --rm get-sosed-server:ci \
  node -e "require('express'); require('sharp'); require('bcrypt')"
```

Node.js `-e` выполняет JavaScript из аргумента. Это проверяет загрузку пакетов,
включая native-модули, внутри собранного образа.

Проверки HTTP используют, например:

```bash
curl --fail --silent --show-error \
  --retry 10 --retry-delay 2 --retry-all-errors \
  --max-time 5 --output "$RUNNER_TEMP/api-adverts.json" \
  http://127.0.0.1:8082/api/adverts
```

- `--fail` — HTTP-ошибка делает команду неуспешной.
- `--retry 10` — до 10 повторов после исходной попытки.
- `--retry-delay 2` — пауза между повторами, в секундах.
- `--retry-all-errors` — разрешить повтор при любых ошибках curl.
- `--max-time 5` — ограничить одну операцию пятью секундами; это не общий
  лимит всех повторов вместе.
- `--output` — записать тело ответа в файл для проверки JSON.
- `RUNNER_TEMP` — каталог временных файлов GitHub runner.

Дополнительно CI ожидает `404` для отсутствующего изображения и `426` для
обычного HTTP-запроса к `/ws`. Последняя проверка не является полноценным
тестом WebSocket-переписки.

### 7.2. Сохранение точных идентификаторов образов

В CI добавили запись stdout `docker push` в лог и извлечение digest:

```bash
set -euo pipefail

docker image push "ghcr.io/$owner/get-sosed-client:$GITHUB_SHA" \
  | tee "$RUNNER_TEMP/client-push.log"

client_digest=$(sed -nE \
  's/.*digest: (sha256:[0-9a-f]{64}) size:.*/\1/p' \
  "$RUNNER_TEMP/client-push.log")
```

| Часть | Расшифровка |
| --- | --- |
| `docker image push` | Загрузить локальный образ в реестр |
| `$GITHUB_SHA` | SHA коммита, по которому работает CI; здесь используется как тег образа |
| `tee файл` | Одновременно показать stdout в логе и записать его в файл |
| `sed -n` | Отключить автоматическую печать всех строк |
| `sed -E` | Использовать расширенные регулярные выражения |
| `s/шаблон/замена/p` | Выполнить замену и напечатать результат при совпадении |
| `(sha256:[0-9a-f]{64})` | Захватить `sha256:` и ровно 64 шестнадцатеричных символа |
| `\1` | Подставить первую захваченную группу |
| `client_digest=$(…)` | Сохранить извлечённую строку в переменную |

Далее оба digest проверяются регулярным выражением. `jq` создаёт JSON:

```bash
jq -n \
  --arg commit "$GITHUB_SHA" \
  --arg client "ghcr.io/$owner/get-sosed-client@$client_digest" \
  --arg server "ghcr.io/$owner/get-sosed-server@$server_digest" \
  '{commit: $commit, client: $client, server: $server}' \
  > "$RUNNER_TEMP/deploy-images.json"
```

- `jq -n` — создать JSON без чтения входного документа.
- `--arg имя значение` — передать в jq строковую переменную с корректным
  экранированием JSON.
- `>` — сохранить результат в файл.

Полученный `deploy-images.json` содержит SHA коммита и точные GHCR-адреса двух
образов. Он сохраняется action `upload-artifact` под именем
`deploy-images-<SHA>`. Это связывает успешный запуск CI с конкретными образами.

В чате также были неуспешные сборки сервера. Пользователь повторил CI и сообщил,
что он прошёл без предложенных исправлений. Сбой внешней инфраструктуры был
предположением, а не установленной причиной. Не следует записывать
неприменённые варианты исправления как итоговые изменения проекта.

## 8. Ручной деплой: где и когда запускается обновление

### 8.1. Три связанных файла

| Файл | Ответственность |
| --- | --- |
| [deploy-production.yaml](/Users/buantosagdurov/Desktop/github/get-sosed/.github/workflows/deploy-production.yaml) | Проверить выбранный CI и артефакт, получить AWS-права, отправить SSM-команду и дождаться результата |
| [SSM deploy-production.yaml](/Users/buantosagdurov/Desktop/github/get-sosed/infrastructure/ssm/deploy-production.yaml) | Описать разрешённые параметры и запуск фиксированного скрипта на Linux-инстансе |
| [deploy-production.sh](/Users/buantosagdurov/Desktop/github/get-sosed/scripts/deploy-production.sh) | Скачать образы, сохранить дамп, применить миграции, обновить контейнеры и проверить API |

Цепочка запуска:

```text
Run workflow в GitHub
  → проверка CI и deploy-images.json
  → временная роль AWS через OIDC
  → aws ssm send-command
  → SSM document GetSosed-DeployProduction, версия 1
  → /usr/local/lib/get-sosed/deploy-production.sh на EC2
  → Compose pull → dump → migrate → up → curl
```

На EC2 установлена отдельная копия скрипта по указанному пути. Её установку
проверяли контрольной суммой; пользователь получил `deploy-production.sh: OK`
и «Сценарий установлен».

Коммит или push файла скрипта не обновляет установленную копию автоматически.
То же относится к Compose/Caddyfile на EC2 и SSM document в AWS. Workflow
жёстко использует версию документа `1`.

### 8.2. Что выполняет серверный скрипт

1. Проверяет, что переданы client/server из разрешённого GHCR namespace с digest.
2. Берёт блокировку `.deploy.lock`, чтобы два деплоя не выполнялись одновременно.
3. Создаёт временный env с новыми `CLIENT_IMAGE` и `SERVER_IMAGE`; остальные
   настройки сохраняет. Проверяет Compose.
4. Создаёт временный `DOCKER_CONFIG`, читает GHCR token из Parameter Store,
   авторизуется в реестре и скачивает образы.
5. Проверяет PostgreSQL и создаёт custom-дамп в production-каталоге `backups`.
6. Запускает миграции из нового серверного образа.
7. Заменяет `production.env` подготовленной версией.
8. Выполняет `up` для `server` и `client`.
9. Повторно проверяет локальный `/api/adverts` до 30 попыток.
10. Удаляет временные файлы и временные Docker credentials при выходе.

Именно эта строка применяет выбранные образы к контейнерам:

```bash
docker compose --env-file production.env --file compose.production.yaml \
  up --detach --no-deps --pull never server client
```

`pull` скачивает файлы образа. `up` создаёт или пересоздаёт контейнеры при
изменении образа/конфигурации. Это два разных этапа. Автоматического отката
контейнеров или миграций при неудачной проверке в скрипте нет.

### 8.3. Отправка команды SSM и ожидание результата

**Фрагменты, выполняемые workflow; переменные формируются предыдущими шагами:**

```bash
parameters=$(jq -nc \
  --arg client "$CLIENT_IMAGE" --arg server "$SERVER_IMAGE" \
  '{ClientImage: [$client], ServerImage: [$server]}')

command_id=$(aws ssm send-command \
  --document-name GetSosed-DeployProduction \
  --document-version 1 \
  --instance-ids "$INSTANCE_ID" \
  --parameters "$parameters" \
  --query 'Command.CommandId' --output text)

aws ssm get-command-invocation \
  --command-id "$command_id" --instance-id "$INSTANCE_ID" --output json
```

| Флаг | Значение |
| --- | --- |
| jq `-c` | Компактный JSON в одну строку; `-n` и `--arg` описаны выше |
| `--document-name` | Какой SSM document выполнить |
| `--document-version 1` | Конкретная версия документа |
| `--instance-ids` | Целевые managed instances для отправки |
| `--parameters` | JSON с параметрами документа |
| `--query 'Command.CommandId'` | Получить только ID созданной команды |
| `--command-id` | ID команды для проверки результата |
| `--instance-id` | Конкретный инстанс, результат которого запрашивается |
| `--output json` | Машиночитаемый JSON |
| `jq -r` в обработке ответа | Вывести строки без JSON-кавычек |

Workflow опрашивает результат с паузами. GitHub ограничивает одновременно
исполняемые деплои через `concurrency`, а EC2 — через `flock`. Отмена workflow
или истечение времени ожидания не доказывает, что уже отправленная SSM-команда
остановилась. [SendCommand](https://docs.aws.amazon.com/cli/latest/reference/ssm/send-command.html),
[GetCommandInvocation](https://docs.aws.amazon.com/cli/latest/reference/ssm/get-command-invocation.html).

SSM document использует `allowedPattern` и `interpolationType: ENV_VAR`:
параметры попадают в `SSM_ClientImage` и `SSM_ServerImage`. Через `env -i`
создаётся очищенное окружение, после чего `/bin/bash` получает фиксированный
путь скрипта и два аргумента образов.

### 8.4. Успешный запуск и упрощение выбора CI

В чате подтверждён успешный ручной деплой по CI ID `42494955846`, коммиту
`5b7fda10d1a2a52b2b03066290f69bd6077c64b2`. Скриншот показал успешный шаг
«Запустить деплой и дождаться результата».

Позже поле `ci_run_id` сделали необязательным. Пустое поле означает поиск
успешного push-CI **для точного `context.sha`** — коммита выбранной ветки в
момент запуска workflow. Это не произвольная последняя успешная сборка.
Если у этого коммита нет успешного CI, workflow останавливается.

Явный ID сохраняет возможность выбрать более ранний успешный CI. Workflow
проверяет репозиторий, ветку `release/initial`, event `push`, имя CI workflow,
его завершение и успешность `publish-images` нужной попытки. Затем сверяет SHA
артефакта и формат обоих адресов образов.

Динамический выпадающий список CI не был реализован. Выбрана схема автоматического
поиска сборки с необязательным ручным ID. Пользователь подтвердил её работу.

## 9. Разбор служебных конструкций серверного скрипта

Эти конструкции уже используются в обычном скрипте деплоя или были предложены
для разовой операции. Они объясняют, как команды соединяются между собой.

| Конструкция | Что делает |
| --- | --- |
| `set -Eeuo pipefail` | `-E` передаёт ERR trap в функции/подоболочки, если такой trap определён; `-e` завершает выполнение при необработанной ошибке с оговорками Bash; `-u` запрещает обращение к неустановленным переменным; `pipefail` учитывает ошибки участников конвейера |
| `set -euo pipefail` | Та же схема без `-E`; используется в workflow и инструкции сброса |
| `umask 077` | По умолчанию новые файлы доступны только владельцу, новые каталоги — только владельцу; это маска при создании, а не изменение старых файлов |
| `exec 9>.deploy.lock` | Открывает lock-файл на файловом дескрипторе 9 в текущей shell-сессии |
| `flock -n 9` | Пытается получить эксклюзивную блокировку; `-n` не позволяет ждать её освобождения |
| `flock -u 9` | Снять блокировку; `-u` означает unlock |
| `exec 9>&-` | Закрыть дескриптор 9 |
| `mktemp -d` | Создать отдельный временный каталог; `-d` выбирает каталог вместо файла |
| `mktemp путь.XXXXXX` | Создать файл с уникальной частью имени по шаблону |
| `trap cleanup EXIT` | Выполнить функцию cleanup при завершении shell-скрипта |
| `export DOCKER_CONFIG=…` | Задать Docker отдельный каталог конфигурации и credentials |
| `mkdir -p` | Создать каталог с родительскими каталогами; существующий каталог не является ошибкой |
| `chmod --reference=production.env файл` | Перенести режим доступа с исходного файла |
| `chown --reference=production.env файл` | Перенести владельца и группу с исходного файла |
| `mv -- источник назначение` | Переместить/переименовать; `--` завершает разбор флагов |
| `rm -rf -- "$temp_dir"` | Рекурсивно удалить именно временный каталог; `-r` рекурсия, `-f` без запросов и без ошибки из-за отсутствующего пути |
| `rm -f -- "$next_env"` | Удалить временный файл; это не команда удаления базы |
| `env -i … команда` | Запустить команду с очищенным окружением и явно переданными переменными |
| `compose=(docker compose …)` | Bash-массив аргументов команды |
| `"${compose[@]}" …` | Раскрыть массив, сохраняя границы каждого аргумента |
| `export` | Передать переменную дочерним процессам |
| `unset` | Удалить shell-переменную |
| `2> файл` | Записать stderr в отдельный файл |
| `>&2` | Направить сообщение в stderr |
| `<<< "$result"` | Передать строку в stdin команды |
| `sleep 10` | Подождать 10 секунд |
| `exit 0` / `exit 1` | Завершиться успешно / с ошибкой |
| `python3 - <<'PY'` | Python читает программу из stdin; кавычки у delimiter запрещают shell-подстановки в её теле |
| `date -u +%Y%m%dT%H%M%SZ` | UTC-время в заданном формате для имени дампа; `-u` выбирает UTC |

`set -e` и последовательность команд не превращают деплой в транзакцию.
Например, успешная миграция не отменится автоматически из-за последующей
неудачи запуска контейнера.

## 10. Яндекс Карты: причина и сохранённые изменения

### 10.1. Как устроена интеграция

При публикации объявления
[geocode-address.ts](/Users/buantosagdurov/Desktop/github/get-sosed/client/src/features/create-advert/model/geocode-address.ts)
отправляет город и адрес в геокодер Яндекса. Координаты из ответа преобразуются
в порядок «широта, долгота» и отправляются вместе с объявлением.

На странице объявления
[YMap.tsx](/Users/buantosagdurov/Desktop/github/get-sosed/client/src/shared/ui/y-map/YMap.tsx)
использует `@pbe/react-yandex-maps`: показывает карту и метку по сохранённым
координатам. Если ключа нет, геокодер не нашёл адрес или запрос завершился
ошибкой, публикация продолжает работать без координат.

При проверке production оба открытых объявления показывали «Координаты не
указаны». В исходной Docker-сборке ключ не передавался: `.env` исключён из
контекста, а код читал `import.meta.env.VITE_YANDEX_API_KEY`.

### 10.2. Что изменили

В [client/Dockerfile](/Users/buantosagdurov/Desktop/github/get-sosed/client/Dockerfile)
перед сборкой добавили:

```dockerfile
ARG VITE_YANDEX_API_KEY
RUN npm run build
```

В шаге публикации CI:

```yaml
env:
  VITE_YANDEX_API_KEY: ${{ vars.VITE_YANDEX_API_KEY }}
```

В команду сборки клиента добавили:

```bash
docker build \
  --tag "ghcr.io/$owner/get-sosed-client:$GITHUB_SHA" \
  --file client/Dockerfile \
  --build-arg VITE_YANDEX_API_KEY \
  client
```

`ARG` объявляет аргумент сборки Docker. `--build-arg NAME` без `=значение`
передаёт одноимённую переменную окружения Docker CLI в сборку. Затем Vite
встраивает значение в JavaScript.

Локально выполнили сборку с тестовым значением:

```bash
VITE_YANDEX_API_KEY=codex-map-build-check npm run build
```

Присваивание перед командой задаёт переменную для этого запуска процесса.
Сборка прошла, тестовая строка найдена в итоговом JavaScript.

Изменения сохранены коммитом `b2df024`; также обновлена
[инструкция деплоя](/Users/buantosagdurov/Desktop/github/get-sosed/docs/production-deploy.md).

### 10.3. Что требует отдельного подтверждения

- Ключ должен быть добавлен в GitHub repository variable
  `VITE_YANDEX_API_KEY`, с доступом к нужным API и ограничением по домену.
- После изменения ключа требуется новая сборка и установка клиентского образа.
- Добавление переменной только в EC2 `production.env` не изменяет готовые
  статические файлы клиента.
- Переменные `VITE_*` видны в JavaScript браузера. Ключ карты нужно
  ограничивать доменом; его нельзя считать скрытым серверным секретом.
- У старых объявлений координаты сами не появятся: геокодирование сейчас
  выполняется при создании.

Работа production-карты с действующим ключом после изменений в чате не
подтверждена. Реализована передача ключа в сборку и выполнена локальная проверка.
[Переменные Vite](https://vite.dev/guide/env-and-mode.html),
[ограничения ключей Яндекса](https://yandex.ru/maps-api/docs/js-api/limit.html).

## 11. Проверка моделей, миграций и всех сидов

### 11.1. Что обнаружили

Файлы сидов находятся в `server/db/seeders`; каталог `/db/seeds` в запросе
был уточнён по реальной структуре проекта. Проверены все 11 файлов, модели,
миграции, внешние ключи, данные профилей и файлы изображений.

Основная ошибка была в порядке создания тегов. Миграция
`20261018000000-add-listing-condition-tags.js` заранее вставляла четыре условия.
Сид `Tags` затем добавлял свой каталог, а `AdvertTags` использовал фиксированные
числовые ID. Например, вместо «Двухкомнатная» и «С мебелью» объявление получало
«Питомцы разрешены» и «С рабочим местом».

Также установили, что полный набор предназначен для пустой базы:

- роли и пользователи вставляются без универсальной обработки повторов;
- связи используют ожидаемые ID новых записей;
- функции `down` сидов не реализуют полноценный откат;
- выполнение всех сидов повторно поверх существующих production-записей
  может привести к ошибкам и неверным связям.

### 11.2. Что исправили по запросу пользователя

1. Удалили миграцию `20261018000000-add-listing-condition-tags.js`.
2. В [Tags](/Users/buantosagdurov/Desktop/github/get-sosed/server/db/seeders/20240827092605-Tags.js)
   добавили в конец списка «Тихие вечера» и «С рабочим местом». «Для некурящих»
   и «Питомцы разрешены» уже существовали в этом сиде.
3. Сохранили прежний порядок каталога для правильных старых ссылок.
4. В [AdvertTags](/Users/buantosagdurov/Desktop/github/get-sosed/server/db/seeders/20240827101623-AdvertTags.js)
   добавили 12 связей, чтобы все четыре условия использовались объявлениями.
5. В [advert-read.test.js](/Users/buantosagdurov/Desktop/github/get-sosed/server/tests/advert-read.test.js)
   заменили тест удалённой миграции проверкой сидов: уникальность названий,
   наличие условий, их использование в связях, правильные ID и отсутствие
   повторных пар `advertId:tagId`.

Эти изменения сохранены в `c5faf40`. Пользователь также параллельно вносил
свои изменения файлов; весь состав коммита не следует приписывать только
работе над сидами.

После изменения на пустой базе получаются такие условия:

| ID тега | Название | Объявления |
| --- | --- | --- |
| 10 | Для некурящих | 1, 3, 8 |
| 11 | Питомцы разрешены | 2, 5, 8 |
| 12 | Тихие вечера | 1, 5, 11 |
| 13 | С рабочим местом | 2, 3, 11 |

### 11.3. Результат реальной локальной проверки

Сиды проверены на отдельной PostgreSQL 16, с применением всех оставшихся
12 миграций. Результат:

| Таблица | Строк |
| --- | ---: |
| Roles | 2 |
| Users | 5 |
| Adverts | 15 |
| Locations | 15 |
| UserProfiles | 5 |
| Chats | 10 |
| Likes | 15 |
| Tags | 13 |
| AdvertTags | 42 |
| AdvertPhotos | 57 |
| UserPhotos | 5 |

Проверены координаты, массивы `habits` после записи в JSONB, строковый тип
телефонов после вставки, отсутствие повторов тегов и связей, существование
62 связанных фотографий и чтение их метаданных через Sharp.

Из каталога `server/` выполнялись:

```bash
npm test
npm run typecheck
```

Все 100 серверных тестов и проверка типов прошли. Также были отдельные проверки
контейнеров и реальной PostgreSQL; unit-тесты сами по себе не заменяли их.
Тестовые контейнеры, сети и volumes после проверок удалены.

Удаление файла миграции не отменяет её в уже существующей БД. Старая база сама
не меняется; новая база получит схему из оставшихся 12 миграций и данные из сидов.

## 12. Итоговый вариант разового переноса базы и фотографий

### 12.1. Какое решение выбрано

Пользователь уточнил задачу: один раз пересоздать production-базу, заполнить
локальными сидами и перенести локальные фотографии в существующее файловое
хранилище. Дамп непосредственно перед этим сбросом не нужен.

Поэтому выбран **отдельный архив данных**, используемый временным контейнером
на EC2. Фотографии не добавляются в каждую последующую сборку приложения.

Сначала были подготовлены изменения Dockerfile, `.dockerignore`, CI и
`compose.ci-images.yaml`, включавшие все сиды и `/app/demo-images`. После
уточнения задачи эти изменения полностью отменены.

В итоговом репозитории:

- `server/Dockerfile` снова копирует только сид ролей и миграции;
- `server/.dockerignore` снова исключает `public/images` целиком;
- обычный CI снова проверяет пустую базу с ролями;
- временная инструкция `docs/reset-demo-database.md`, ссылка на неё и отдельное
  исключение `.gitignore` удалены; инструкция осталась внутри архива;
- перед созданием данного конспекта `git status --short` был пустым.

«Чистая рабочая директория» означает отсутствие незакоммиченных изменений.
Это не отменяет сохранённые коммиты про карты, миграции или сиды.

### 12.2. Подготовленный архив

| Параметр | Значение |
| --- | --- |
| [Архив](/tmp/get-sosed-seed-once-c5faf40.tar.gz) | `/tmp/get-sosed-seed-once-c5faf40.tar.gz` |
| [Файл контрольной суммы](/tmp/get-sosed-seed-once-c5faf40.tar.gz.sha256) | То же имя с суффиксом `.sha256` |
| Размер | 14 850 645 байт, около 14,2 MiB |
| Миграции | 12 |
| Сиды | 11 |
| Изображения | Все 66 файлов локального `server/public/images` на момент упаковки |

SHA-256 архива:

```text
34f929237e20f0540e74911822659483a25126ed38b0df1cc6292e82789448b8
```

Структура:

```text
seed-once/
├── db/migrations/
├── db/seeders/
├── public/images/
├── compose.seed-once.yaml
├── README.md
└── SHA256SUMS
```

`.env` и production credentials в архив не включены. `SHA256SUMS` проверяет
файлы внутри пакета; внешний `.sha256` — весь сжатый архив.

Из 66 изображений сиды используют 62: 57 фото объявлений и 5 фото пользователей.
Ещё 4 файла находятся в `public/images/advert-16`. Они также переносятся,
но сиды не создают для них записи фотографий.

Архив в `/tmp` — временный рабочий файл для переноса, а не долгосрочное
резервное хранилище. При изменении исходных сидов или изображений пакет нужно
сформировать и проверить заново.

### 12.3. Как пакет подключается к контейнеру

Внутри архива находится Compose override:

```yaml
services:
  migrate:
    volumes:
      - ${GET_SOSED_SEED_DIR:?Set GET_SOSED_SEED_DIR}:/app/seed-data:ro
      - production_uploads:/app/public/images
```

- `${…:?…}` — обязательное значение; Compose завершится ошибкой, если оно
  не задано или пустое.
- `GET_SOSED_SEED_DIR` — абсолютный путь распакованного пакета на EC2.
- `/app/seed-data:ro` — исходные данные доступны контейнеру только для чтения.
- `production_uploads:/app/public/images` — тот же named volume, который
  использует production API; он доступен для записи.
- Для обращения к существующему volume нужно сохранить имя Compose-проекта
  и основной production Compose-файл. Другая конфигурация project name может
  выбрать новое хранилище с другим Docker-именем.
- Каталог расположен внутри `/app`, чтобы `require('bcrypt')` в сиде
  пользователей мог найти зависимости в `/app/node_modules`.

Пакет проверен с локальным серверным образом проекта. Выданная процедура
использует установленный EC2-образ из `production.env`; его содержимое отдельно
через AWS/SSH при подготовке пакета не инспектировали. Для запуска пакета нужны
Node.js, Sequelize CLI и зависимости проекта, которые входят в штатный образ.
Отдельная сборка ради доставки данных не требуется.

### 12.4. Команды разовой операции: подготовлены, на EC2 не подтверждены

Это описание выданной инструкции. **Нет подтверждения, что пользователь уже
скопировал архив или выполнил сброс на production.** Команды удаления ниже
не являются отчётом об уже выполненных действиях.

**Копирование с Mac и подключение:**

```bash
EC2_KEY='/путь/к/своему/ключу.pem'
EC2_HOST='адрес-своего-ec2'

scp -i "$EC2_KEY" \
  /tmp/get-sosed-seed-once-c5faf40.tar.gz \
  /tmp/get-sosed-seed-once-c5faf40.tar.gz.sha256 \
  "ubuntu@$EC2_HOST:~/get-sosed-production/"

ssh -i "$EC2_KEY" "ubuntu@$EC2_HOST"
```

`scp` копирует файлы по SSH, `ssh` открывает удалённую сессию. В обеих командах
`-i` указывает путь к приватному ключу. В чат запрашивалась только команда
подключения/путь к файлу, не содержимое приватного ключа. Значения выше —
заполнители; настоящий адрес и имя ключа не были предоставлены.

**Проверка и распаковка на EC2:**

```bash
cd ~/get-sosed-production
sha256sum --check get-sosed-seed-once-c5faf40.tar.gz.sha256
test ! -e seed-once && tar -xzf get-sosed-seed-once-c5faf40.tar.gz
```

- `--check`, сокращённо `-c`, — сравнить файл с записанной контрольной суммой.
- `test ! -e seed-once` — убедиться, что путь ещё не существует.
- `&&` — выполнить вторую команду только при успехе первой.
- `tar -x` — извлечь архив; `-z` — gzip, `-f` — следующий аргумент задаёт файл.

**Root-сессия, блокировка и команды Compose:**

```bash
sudo -i
set -euo pipefail
cd /home/ubuntu/get-sosed-production

exec 9>.deploy.lock
flock -n 9

export GET_SOSED_SEED_DIR="$PWD/seed-once"
production_compose=(docker compose --env-file production.env --file compose.production.yaml)
seed_compose=(docker compose --env-file production.env --file compose.production.yaml --file seed-once/compose.seed-once.yaml)

"${seed_compose[@]}" config --quiet
"${seed_compose[@]}" run --rm --no-deps --pull never --entrypoint sh migrate -ec '
  cd /app/seed-data
  sha256sum -c SHA256SUMS >/dev/null
  test -s db/seeders/20240829122246-UserPhotos.js
  test ! -e db/migrations/20261018000000-add-listing-condition-tags.js
  test -s public/images/users/user-1/0.webp
  echo "Разовый пакет проверен"
'
```

- `sudo -i` — открыть отдельную login-сессию root.
- `PWD` — текущий каталог; `export` передаёт путь Docker Compose.
- Повторные `--file` объединяют конфигурации в указанном порядке.
- `config --quiet` проверяет полученную конфигурацию.
- `run` запускает новый одноразовый контейнер, `exec` — команду в работающем.
- `--entrypoint sh` выбирает оболочку; `-ec` — флаги самой оболочки:
  `-e` остановка при необработанной ошибке, `-c` выполнение строки.
- `test -s` проверяет существование непустого файла; `test -d`, использованный
  в полной инструкции, проверяет каталог.
- `>/dev/null` скрывает обычный вывод проверки SHA, но не её ошибки.
- До удаления БД должны успешно пройти проверки пакета и конфигурации.

Значения остальных флагов Compose и механика блокировки разобраны в разделах
3, 4 и 9. Named volume не удаляется при завершении контейнера с `--rm`.
[Compose Run](https://docs.docker.com/reference/cli/docker/compose/run/).

**Удаление старой базы и создание пустой — без дампа:**

```bash
"${production_compose[@]}" stop server

"${production_compose[@]}" exec -T db sh -ec '
  case "$POSTGRES_DB" in postgres|template0|template1|"") exit 1 ;; esac
  dropdb --force --username "$POSTGRES_USER" --maintenance-db postgres "$POSTGRES_DB"
  createdb --username "$POSTGRES_USER" --maintenance-db postgres --owner "$POSTGRES_USER" "$POSTGRES_DB"
'
```

- `stop server` — остановить API, чтобы оно не работало с пересоздаваемой базой.
- `case` исключает системные базы и пустое имя.
- `dropdb` — удалить указанную базу.
- `--force` — попытаться завершить мешающие подключения. Это не гарантия
  удаления при любых блокирующих условиях PostgreSQL.
- `--maintenance-db postgres` — служебное соединение для удаления/создания
  целевой базы.
- `createdb --owner` — назначить владельца новой базы.

Имена БД приложения в `production.env` и окружении контейнера PostgreSQL должны
обозначать одну целевую базу, как в настроенной production-схеме.
Volumes PostgreSQL, изображений и Caddy командами `dropdb` не удаляются.
[Dropdb](https://www.postgresql.org/docs/16/app-dropdb.html),
[Createdb](https://www.postgresql.org/docs/16/app-createdb.html).

**Миграции, файлы и сиды из архива:**

```bash
"${seed_compose[@]}" run --rm --no-deps --pull never migrate \
  ./node_modules/.bin/sequelize db:migrate \
  --migrations-path /app/seed-data/db/migrations

"${seed_compose[@]}" run --rm --no-deps --pull never --entrypoint sh migrate -ec '
  cp -R /app/seed-data/public/images/. /app/public/images/
  ./node_modules/.bin/sequelize db:seed:all --seeders-path /app/seed-data/db/seeders
'
```

- `db:migrate` — применить миграции, ещё не отмеченные выполненными в этой БД.
- `--migrations-path` — читать миграции именно из пакета.
- `cp -R` — рекурсивно скопировать каталоги и файлы.
- `источник/.` — копировать содержимое каталога, включая скрытые элементы.
- `db:seed:all` — выполнить все сиды из выбранного каталога.
- `--seeders-path` — выбрать доставленные сиды вместо сида ролей внутри образа.

Копируются все 66 файлов; записи фотографий создаются для 62 из них. Старые
файлы в volume остаются. Файлы с совпадающими путями заменяются копиями из
пакета. Повторный `db:seed:all` поверх заполненной базы не предусмотрен.

Счётчики после заполнения проверяются через `psql --command 'SELECT …'`, как
в разделе 5, но для таблиц Users, Adverts, Tags, AdvertTags, AdvertPhotos и
UserPhotos. Ожидаемый результат: `5 | 15 | 13 | 42 | 57 | 5`.
В инструкции также используется `--set ON_ERROR_STOP=1`: это переменная psql,
требующая прекращать выполнение при SQL-ошибке.

**Обновление ключей JWT перед запуском:**

```bash
python3 - <<'PY'
from pathlib import Path
import secrets

path = Path('production.env')
lines = path.read_text().splitlines(keepends=True)
for key in ('ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET'):
    indexes = [i for i, line in enumerate(lines) if line.startswith(key + '=')]
    if len(indexes) != 1:
        raise SystemExit('Ожидалась одна строка ' + key)
    lines[indexes[0]] = key + '=' + secrets.token_urlsafe(48) + '\n'
path.write_text(''.join(lines))
PY
```

Скрипт заменяет две строки в существующем env, сохраняя права файла и не
печатает ключи. `token_urlsafe(48)` использует 48 случайных байт до кодирования,
а не задаёт длину результата в 48 символов. Это инвалидирует старые токены:
после сброса новые пользователи получают ID, которые ранее принадлежали другим
аккаунтам. На production эта смена ключей пока не подтверждена.

**Запуск и освобождение блокировки:**

```bash
"${production_compose[@]}" up --detach --no-deps --pull never server client

curl --fail --silent --show-error \
  --retry 15 --retry-delay 2 --retry-all-errors --max-time 5 \
  --output /dev/null http://127.0.0.1:8082/api/adverts

flock -u 9
exec 9>&-
exit
```

Флаги curl имеют значения из раздела 7; здесь разрешены до 15 повторов.
`exit` закрывает root-сессию. Пароли демонстрационных аккаунтов, включая Admin,
заданы в сидах; сами пароли в этот конспект не перенесены.

### 12.5. Что проверили и чего ещё не делали

В отдельном тестовом Compose-проекте реально создали старую контрольную
запись, удалили тестовую базу, создали новую, выполнили миграции и сиды из
архива, скопировали фотографии в volume и запустили API. Получены нужные
счётчики, 15 объявлений, 13 тегов и HTTP 200 для фото пользователя и объявления.
Финальная проверка API выполнялась непосредственно внутри серверного
контейнера, а не через production Caddy. Тестовые ресурсы удалены.

На EC2 ещё не подтверждены: доставка архива, удаление старой базы, создание
новой, применение сидов, копирование этих локальных изображений и смена
JWT-ключей. Полученное ранее согласие на сброс не является результатом его
выполнения.

## 13. Git: как сохранялись и проверялись изменения

В чате пользователь самостоятельно делал коммиты и push. Ассистент готовил
изменения и объяснял команды. Типовой цикл:

```bash
git status --short --branch
git diff --check
git add client/nginx.conf
git --no-pager diff --cached
git diff --cached --check
git commit -m "release: fix: increase upload request limit"
git push origin release/initial
```

| Команда/флаг | Значение |
| --- | --- |
| `status --short` | Краткий список изменений |
| `--branch` | Дополнительно показать ветку и связь с upstream |
| `diff --check` | Проверить изменения на ошибки пробелов и лишние пустые строки |
| `add путь` | Добавить конкретные изменения в staging area |
| `--no-pager` | Показать вывод без интерактивного просмотрщика |
| `diff --cached` | Посмотреть подготовленные к коммиту изменения |
| `diff --cached --check` | Проверить пробелы именно в staged-изменениях |
| `diff --cached --stat` | Показать статистику подготовленных изменений |
| `commit -m` | Создать коммит с сообщением из аргумента |
| `push origin release/initial` | Отправить ветку в remote `origin` |
| `git push` без аргументов | Использовать настроенный upstream текущей ветки |

При добавлении Caddyfile Git показал `new blank line at EOF`. Лишнюю пустую
строку убрали, файл повторно добавили в staging и успешно проверили.
Hooks коммитов запускали проверки staged-файлов и временно сохраняли состояние
через stash; сообщения об этом были видны в выводе коммитов.

### Основные зафиксированные этапы

| Коммит | Работа |
| --- | --- |
| `405ba75` | Лимит загрузки Nginx |
| `8bec293` | Production Compose, Caddyfile, HTTPS и ignore для `production.env` |
| `09caf7d` | Ручная проверка AWS-подключения |
| `cfd0823` | Диагностика OIDC claims |
| `c0e8a0d` | Сохранение опубликованных digest в CI-артефакте |
| `0d58a69` | Проверка образов для ручного деплоя |
| `a5592d5` | Обновление action скачивания артефактов |
| `b744b10` | Скрипт обновления production |
| `6d18831` | SSM document |
| `5b7fda1` | Вызов реального production-деплоя из workflow |
| `1430378` | Обновление AWS credentials action |
| `189f09b` | Автоматический выбор успешного CI для текущего коммита |
| `b2df024` | Передача ключа Яндекса в сборку клиента |
| `c5faf40` | Изменения миграции тегов и сидов, обновлённые проверки |

В репозитории есть и другие коммиты. Таблица перечисляет основные этапы,
обсуждавшиеся в этой части работы, а не полный Git log.

## 14. Что обсуждалось как дальнейшая работа

Были предложены: проверки публичного HTTPS после деплоя, healthchecks,
управляемый откат, обновление серверной конфигурации из кода, мониторинг,
ротация логов, регулярные offsite-копии с тестами восстановления, дополнительные
проверки механизма деплоя, кеширование сборок, проверки уязвимостей,
инфраструктура как код и staging.

Это список предложений. Их обсуждение не означает, что они реализованы.
В частности, в текущей подтверждённой схеме нет автоматического rollback,
автоматического production-reset, автоматического заполнения всеми demo-сидами
при обычном деплое или подтверждённого развёртывания staging.

## 15. Как читать результаты команд

- Отсутствие вывода у `git diff --check` обычно означает, что замечаний нет.
- Пустой `git status --short` означает чистое рабочее дерево, а не отсутствие
  изменений в истории коммитов.
- `Login Succeeded` подтверждает вход в реестр, но не скачивание нужного образа.
- Успешный `docker pull` подтверждает наличие образа, но не обновление контейнера.
- `Up` подтверждает работающий процесс контейнера; готовность API проверяется
  отдельно HTTP-запросом.
- Совпадение SHA-256 подтверждает совпадение байтов файлов, но проверка
  восстановления БД требует отдельного `pg_restore`.
- Успешные локальные тесты не являются подтверждением выполнения на EC2.
- Подготовленный архив и выданные команды не означают, что production-база уже
  была пересоздана.

# Документация API

[openapi.yaml](./openapi.yaml) — спецификация HTTP API по
[OpenAPI 3.0.3](https://spec.openapis.org/oas/v3.0.3.html). Описаны все 20
операций из `src/router/`: авторизация, обновление токенов, объявления, профили,
диалоги и лайки. Документ отражает текущую реализацию; при изменении маршрутов,
валидации или ответов обновляйте спецификацию вместе с кодом.

## Просмотр

Откройте файл в редакторе с поддержкой OpenAPI или импортируйте в Swagger
Editor, Swagger UI либо Postman. Отдельный HTTP-маршрут документации в
приложении не добавлен.

Для локального Swagger UI можно выполнить из корня репозитория:

```sh
docker run --rm -p 8080:8080 \
  -e SWAGGER_JSON=/docs/openapi.yaml \
  -v "$PWD/server/docs:/docs:ro" \
  swaggerapi/swagger-ui
```

Откройте `http://localhost:8080`. Для запросов к запущенному API выберите сервер
`http://localhost:3000` (или измените URL в спецификации под свой `PORT`).
Значение `/` предназначено для размещения документации на одном origin с API.
PostgreSQL и переменные окружения нужны для работы API, но не для просмотра
файла.

Проверка спецификации из `server/`:

```sh
npx --yes @apidevtools/swagger-cli validate docs/openapi.yaml
```

## Авторизация

1. Отправьте `POST /api/auth/signup` или `POST /api/auth/login`.
2. Сохраните `accessToken` из JSON-ответа и передавайте
   `Authorization: Bearer <accessToken>` в защищённых запросах. В Swagger UI
   вставьте сам токен в диалоге **Authorize**.
3. Сервер также устанавливает HttpOnly cookie `refreshToken`.
   `GET /api/tokens/refresh` читает cookie, возвращает новую сессию и обновляет
   cookie. Сохраняйте cookie между запросами.
4. `GET /api/auth/logout` очищает cookie. Уже выданный access token продолжает
   действовать до истечения срока.

HTTP middleware и WebSocket upgrade проверяют подпись JWT и структуру его
payload: `user` должен быть объектом с положительным безопасным целочисленным
`id`. Необязательное `name` должно быть строкой или `null`. Остальные поля
пользователя сохраняются для совместимости с выданными сессиями.

Пример с cookie jar (не добавляйте файл cookie и токены в Git):

```sh
curl -c /tmp/get-sosed-cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"password123"}' \
  http://localhost:3000/api/auth/login

curl -b /tmp/get-sosed-cookies.txt -c /tmp/get-sosed-cookies.txt \
  http://localhost:3000/api/tokens/refresh

curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  'http://localhost:3000/api/adverts/mine?page=1&limit=12'
```

`$ACCESS_TOKEN` в последнем примере нужно заполнить токеном из ответа входа или
обновления сессии.

Swagger UI на другом origin позволяет читать документацию, но браузерные запросы
с refresh cookie ограничены текущими настройками CORS сервера (`cors()` без
credentials) и cookie. Для полного сценария используйте один origin или
HTTP-клиент с cookie jar.

## Загрузка фотографий

- Регистрация: необязательный файл в поле `file`, до 10 MiB.
- Публикация объявления: 1–10 файлов в повторяемом поле `files`, до 10 MiB
  каждый.
- Обновление профиля: один файл `photo`, до 5 MiB. `removePhoto=true` удаляет
  фото; совмещать с файлом нельзя.

Формат запроса — `multipart/form-data`, изображения — JPEG, PNG или WebP. Сервер
декодирует изображения и сохраняет WebP. `tagIds` при публикации и `habits` при
обновлении профиля передаются текстовыми полями с JSON-массивом, например
`tagIds=[1,2]` и `habits=["Не курю"]`. URL фотографий возвращаются относительно
origin API, например `/images/users/user-1/avatar.webp`.

## Особенности текущего контракта

- Неверный access token возвращает **403** и HTML-тело `Invalid access token`;
  неверный refresh token — **401**, текст `Unauthorized` и очистку cookie.
  Ошибка обработчика обновления токенов возвращает **501**.
- Форматы ошибок отличаются: `{ code, message }`, `{ message }`, `{ error }` и
  текстовые ответы. Спецификация сохраняет эти различия.
- `GET /api/adverts` возвращает все объявления. Фильтры принимаются через
  `POST /api/adverts/filters`; второй GET-обработчик в цепочке корневого
  маршрута не достигается после отправки ответа первым.
- `GET /api/adverts/liked` возвращает записи лайков с вложенным `Advert`, а не
  плоский массив объявлений. Только `/api/adverts/mine` поддерживает пагинацию.
- `GET /api/users/{userId}` возвращает последние сообщения диалогов текущего
  пользователя; краткий профиль доступен через
  `GET /api/users/{userId}/summary`.
- Удаление объявления не реализовано. `DELETE /api/adverts/{advertId}` возвращает
  **404** `{ "code": "API_ROUTE_NOT_FOUND", "message": "API route not found" }`.
- Неизвестные `/api/*` возвращают **404**
  `{ "code": "API_ROUTE_NOT_FOUND", "message": "API route not found" }`.

## WebSocket чата

Чат использует `ws://localhost:3000/ws` (в HTTPS-окружении — `wss://<host>/ws`)
и cookie `refreshToken`. Без действительной cookie upgrade отклоняется с
**401**; обычный HTTP-запрос `/ws` возвращает **426**. OpenAPI описывает
HTTP-операции; события WebSocket приведены здесь отдельно.

Клиент отправляет JSON:

```json
{ "type": "GET_HISTORY_PAGE", "payload": { "requestId": "history-1", "receiverId": 2, "limit": 50 } }
```

```json
{ "type": "INITIALIZE", "payload": { "receiverId": 2 } }
```

```json
{ "type": "ADD_MESSAGE", "payload": { "receiverId": 2, "text": "Привет!" } }
```

`receiverId` — положительный безопасный целочисленный ID существующего
пользователя, отличный от текущего пользователя. Текст — непустая строка до 10
000 символов; сохраняется после `trim()`.

В `GET_HISTORY_PAGE` поле `requestId` — строка, непустая после `trim()`.
`receiverId`, `limit` и курсоры передаются числами. `limit` — целое число от 1
до 100, по умолчанию 50. Без курсора сервер возвращает последние сообщения.
`beforeId` выбирает сообщения с меньшими ID, а `afterId` — с большими.
Границы исключающие, передать оба курсора нельзя. Курсоры должны быть
положительными безопасными целыми числами. Значение `afterId: 0` позволяет
восстановить сообщения, поступившие после разрыва связи с пустым диалогом.
Сервер выбирает сообщения в обоих направлениях между авторизованным
пользователем и указанным собеседником.
При переподключении `afterId` возвращает сообщения, видимые запросу и имеющие
ID выше сохранённого курсора. Курсор служит границей выборки по ID, а отметка
подтверждённой доставки на сервере не хранится.

События сервера:

| type           | Содержимое                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `SET_USERS`    | `payload`: массив подключений `{ id, name }`. Несколько вкладок одного пользователя могут дать повторяющиеся ID. |
| `HISTORY_PAGE` | `requestId`, `receiverId`, `payload` (страница сообщений по возрастанию ID), `hasMore` и `nextCursor`. Ответ получает запросившее подключение. |
| `SET_MESSAGES` | `receiverId` и `payload`: полная история диалога по возрастанию ID в ответ на `INITIALIZE`.                        |
| `ADD_MESSAGE`  | `payload`: сохранённое сообщение; рассылается подключениям обоих участников.                                     |
| `CHAT_ERROR`   | `receiverId` и `payload`: `Не удалось выполнить запрос чата.`                                                    |

В `HISTORY_PAGE` поле `hasMore` указывает, остались ли сообщения в запрошенном
направлении. При `hasMore: true` в `nextCursor` приходит минимальный ID страницы
для первого запроса и `beforeId` или максимальный ID для `afterId`.
При `hasMore: false` курсор равен `null`, в том числе для пустой страницы.
В ошибке `GET_HISTORY_PAGE` сервер возвращает `requestId`, если и он, и
`receiverId` пригодны для сопоставления ответа с запросом.

Объект сообщения содержит `id`, `senderId`, `receiverId`, `message`,
`createdAt`, `updatedAt`, `sender` и `receiver`. Каждый участник содержит `id`,
`name` и `UserProfile` с `photo` (профиль может быть `null`). Неизвестные типы
входящих событий игнорируются.

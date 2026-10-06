# Get Sosed — фронтенд

React, TypeScript, Vite, Redux Toolkit и Chakra UI. Структура кода и правила
импортов описаны в [ARCH.md](./ARCH.md).

## Запуск

```sh
npm install
cp .env.example .env
npm run dev
```

Vite проксирует `/api`, `/images` и `/ws` на сервер по адресу
`http://localhost:3000`. Для геокодирования при публикации объявления укажите
`VITE_YANDEX_API_KEY` в `.env`. По умолчанию клиент использует текущий хост для
WebSocket; `VITE_API_URL` и `VITE_WS_URL` позволяют переопределить адреса.

## Проверки

```sh
npm run build
npm run lint
npm test
```

Сборка записывается в `../server/dist`, откуда Express раздаёт SPA. `lint`
включает проверку границ FSD. `test` запускает автоматические проверки ключевых
сценариев без отдельного тестового сервера.

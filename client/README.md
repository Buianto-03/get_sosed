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
npm run test
```

Сборка записывается в `../server/dist`, откуда Express раздаёт SPA. `lint`
включает проверку границ FSD. `test` запускает Vitest и ищет colocated тесты в
`src` (`*.test.ts` и `*.test.tsx`). Компоненты проверяются в jsdom через React
Testing Library. TypeScript проверяет тесты вместе с исходниками, а Vite не
добавляет их в production-бандл.

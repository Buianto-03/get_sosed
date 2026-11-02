# Get Sosed — фронтенд

React, TypeScript, Vite, Redux Toolkit и собственный UI kit на SCSS Modules. Структура кода и правила
импортов описаны в [ARCH.md](./ARCH.md).

## Запуск

```sh
npm install
cp .env.example .env
npm run dev
```

Vite проксирует `/api`, `/images` и `/ws` на сервер по адресу
`http://localhost:3000`; API запускается отдельно командой
`npm --prefix server run dev` из корня репозитория. Для геокодирования при публикации объявления укажите
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

## Интерфейс и маршруты

Общие стили находятся в `src/shared/styles`; каталог компонентов —
[UI kit](src/shared/ui/README.md), визуальные правила — [DESIGN.md](DESIGN.md).

Рабочие адреса: `/`, `/about`, `/listings`, `/listings/:listingId`,
`/sign-in`, `/sign-up`, `/profile`, `/profile/edit`, `/listings/new`,
`/messages`, `/messages/:receiverId`. Профиль, публикация и сообщения защищены
с сохранением назначения после входа. Прежние `/home`, `/advert/:id`, `/post`,
`/account`, `/chat/:receiverId`, `/signin`, `/signup` не имеют aliases или redirects.
ChakraProvider и старые UI-компоненты удалены в Q03; необходимые API/Redux/thunks сохранены.
Результаты очистки и открытые ручные проверки Q02 — в
[журнале интеграции](../docs/redesign-integration-progress.md#27-q03--удаление-старого-ui-2-ноября-2026).

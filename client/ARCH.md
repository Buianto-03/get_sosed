# Миграция фронтенда на Feature-Sliced Design

План переноса `client/src` с текущей структуры по техническим ролям
(`components/`, `redux/`, `services/`, `types/`) на
[Feature-Sliced Design](https://feature-sliced.design/ru/).

Принцип миграции: **приложение остаётся рабочим после каждого этапа**. Каждый этап
— отдельный PR, в конце которого проходят `npm run build` и `npm run lint`, а все
страницы открываются и работают вручную (чек-лист смоук-теста — в конце
документа).

---

## Текущие проблемы

| Проблема | Где |
|---|---|
| Страницы-монолиты: сокет, загрузка данных, форма с валидацией, модалка в одном компоненте | `components/pages/Account/AccountPage.tsx` (401 строка), `PostAdvertPage.tsx` |
| Один слайс на несколько сущностей: объявления, выбранное объявление, фильтры, теги, лайкнутые, популярные | `redux/slices/adverts/advertsSlice.tsx` |
| Слайс реагирует на thunk чужого слайса | `advertsSlice` → `deleteLikeThunk` |
| Дублированная логика WebSocket, захардкоженный `ws://localhost:3000` | `ChatPage.tsx:24`, `AccountPage.tsx:75` |
| Синхронизация фильтров с URL в трёх местах | `initialState` в `advertsSlice`, `AdvertList.tsx`, `Filter.tsx` |
| Глубокие относительные импорты `../../../redux/...`, нет публичного API модулей | везде |
| Роутер пересоздаётся при каждом изменении `user` | `components/hooks/useAppRouter.tsx` |
| Три UI-библиотеки: Chakra + `react-bootstrap` (только `Nav.Link`) + `reactstrap` (только `Spinner`) | `Navbar.tsx`, `HOC/Loader.tsx` |
| URL заглушки аватара скопирован 4 раза | `Navbar.tsx`, `AccountPage.tsx` ×2, `ChatPage.tsx` |

---

## Целевая структура

```
src/
├── app/
│   ├── providers/        # StoreProvider, ChakraProvider, RouterProvider
│   ├── router/           # конфиг роутов, создаётся один раз
│   ├── store/            # configureStore, RootState, AppDispatch
│   ├── layouts/          # BaseLayout (header + outlet + footer + loader)
│   └── index.tsx
├── pages/
│   ├── welcome/          # /
│   ├── search/           # /home
│   ├── advert-details/   # /advert/:id
│   ├── advert-create/    # /post
│   ├── account/          # /account
│   ├── chat/             # /chat/:receiverId
│   ├── sign-in/          # /signin
│   └── sign-up/          # /signup
├── widgets/
│   ├── header/
│   ├── footer/
│   ├── advert-feed/      # список + «показать ещё»
│   ├── popular-adverts/
│   ├── advert-info/      # описание, владелец, лайки, карта
│   ├── profile-card/
│   ├── liked-adverts/
│   ├── chat-list/
│   └── chat-window/
├── features/
│   ├── auth/sign-in/
│   ├── auth/sign-up/
│   ├── auth/logout/
│   ├── advert-filter/
│   ├── tag-search/
│   ├── toggle-like/
│   ├── create-advert/
│   ├── edit-profile/
│   ├── remove-liked-advert/
│   └── send-message/
├── entities/
│   ├── session/          # accessToken, текущий user, UserStatus
│   ├── user/
│   ├── advert/
│   ├── tag/
│   ├── like/
│   └── chat/
└── shared/
    ├── api/              # axios-инстанс + интерсептор refresh
    ├── config/           # env
    ├── lib/              # redux-хуки, url-хелперы
    └── ui/               # Loader, ProtectedRoute, YMap, PhotosCarousel
```

Внутри слайса — сегменты `api/`, `model/`, `ui/`, `lib/` (только нужные) и
обязательный `index.ts`:

```
entities/advert/
├── api/advertApi.ts
├── model/types.ts        # zod-схемы и выведенные типы
├── model/slice.ts
├── model/thunks.ts
├── model/selectors.ts
├── ui/AdvertCard.tsx
└── index.ts              # публичный API слайса
```

### Правила

1. Импорт только вниз по слоям: `app → pages → widgets → features → entities → shared`.
2. Слайсы одного слоя не импортируют друг друга. Исключение для `entities` —
   кросс-импорт через `@x`-нотацию (`entities/advert/@x/like.ts`), только для
   типов.
3. Импорт снаружи слайса — только через его `index.ts`:
   `import { AdvertCard } from '@/entities/advert'`.
4. `shared` не знает о бизнес-сущностях (никаких `advert`, `user` внутри).
5. Внутри слайса — относительные импорты, между слайсами — через алиас `@/`.

---

## Этап 0. Исправить баги до переноса

Цель — не тащить ошибки в новую структуру и иметь рабочую точку отсчёта.

- [ ] `redux/slices/adverts/advertsSlice.tsx:87` — результат `state.liked.filter(...)`
      не присваивается; заменить на `state.liked = state.liked.filter(...)`.
- [ ] `deleteLikeThunk` / `likeService.deleteLike` — аргумент типизирован как
      `LikeType['id']`, а сервер (`DELETE /api/likes/:advertId`) ждёт id объявления.
      Привести тип к `AdvertType['id']`, проверить вызов в `ConfirmDeleteModal.tsx`.
- [ ] `PostAdvertPage.tsx:45` — вынести API-ключ Яндекса в `VITE_YANDEX_API_KEY`
      (`.env.example`, `env.d.ts`); запрос к геокодеру делать через чистый `axios`,
      а не через `axiosInstance`, чтобы не отправлять Яндексу `Authorization`.
      Ключ, уже попавший в git, стоит перевыпустить.
- [ ] Вернуть `ProtectedRoute` для `/post`.
- [ ] Удалить заглушки `export const a = 3` в `redux/slices/chat/thunks.ts` и
      `redux/slices/userProfile/thunks.ts`.
- [ ] Удалить `vite.config.ts.timestamp-*.mjs` и добавить шаблон в `.gitignore`.

**Готово, когда:** лайк/дизлайк и удаление из «Понравившихся» обновляют UI без
перезагрузки; в исходниках нет ключей.

---

## Этап 1. Инфраструктура

- [ ] Алиас `@/*` → `src/*`:
  - `tsconfig.json`: `"baseUrl": "."`, `"paths": { "@/*": ["src/*"], "ymaps3": [...] }`,
    `"moduleResolution": "bundler"`;
  - `vite.config.ts`: `resolve.alias: { '@': path.resolve(__dirname, 'src') }`;
  - ESLint: `eslint-import-resolver-typescript`, чтобы `import/no-unresolved` понимал алиас.
- [ ] Создать пустые папки слоёв `app`, `pages`, `widgets`, `features`, `entities`, `shared`.
- [ ] Подключить [Steiger](https://github.com/feature-sliced/steiger)
      (`npx steiger src`) в режиме предупреждений — пока старые папки живы, он
      будет ругаться; строгим режим станет на этапе 7.

**Готово, когда:** импорт через `@/` работает в dev, build и lint.

---

## Этап 2. `shared`

- [ ] `services/client.ts` → `shared/api/client.ts`.
  Зависимость от стора оставить через `injectStore`, но типизировать не через
  `AppStore`, а через минимальный интерфейс (`getAccessToken`, `onTokenRefreshed`),
  чтобы `shared` не импортировал `app`.
- [ ] `shared/config/env.ts` — `API_URL`, `WS_URL`, `YANDEX_API_KEY` из
      `import.meta.env` с дефолтами для dev. `WS_URL` по умолчанию собирать из
      `window.location` (`ws(s)://host`), а не `localhost:3000`.
- [ ] `redux/hooks.ts` → `shared/lib/redux/hooks.ts` (типы `RootState`/`AppDispatch`
      берутся через `import type` из `app/store` — это допустимо только для типов;
      альтернатива — объявить их в `shared/lib/redux/types.ts` через
      module augmentation).
- [ ] `shared/ui`:
  - `HOC/Loader.tsx` → `shared/ui/Loader` на Chakra `Spinner`; удалить `reactstrap`;
  - `hooks/ProtectedRoute.tsx` → `shared/ui/ProtectedRoute`;
  - `advertPageUI/YMap.tsx` → `shared/ui/YMap`;
  - `advertPageUI/PhotosCarousel.tsx` → `shared/ui/PhotosCarousel` (принимает
    `string[]`, а не `AdvertPhotos`).
- [ ] `shared/lib/url/` — хелперы `readNumberParam`, `readStringParam` для работы
      с `URLSearchParams`.

**Готово, когда:** старые компоненты импортируют перенесённые модули из
`@/shared/...`, старые файлы удалены.

---

## Этап 3. `app`

- [ ] `main.tsx` + `App.tsx` → `app/index.tsx` и `app/providers/`.
- [ ] `redux/store.ts` → `app/store/index.ts`. Редьюсеры пока импортируются из
      старых путей — на следующих этапах пути будут меняться.
- [ ] `useAppRouter.tsx` → `app/router/index.tsx`: роутер создаётся **один раз**
      на уровне модуля. Защиту роутов перенести внутрь элемента:
      `ProtectedRoute` сам читает `session` из стора, а в конфиге остаётся
      `<ProtectedRoute access="logged" redirect="/signin">`.
- [ ] `components/Layout.tsx` → `app/layouts/BaseLayout.tsx`.
- [ ] `checkAuthThunk` при старте — в `app/providers` (или `app/index.tsx`).

**Готово, когда:** роутер не пересоздаётся при логине/логауте (проверить, что
состояние формы на странице не сбрасывается при фоновом refresh токена).

---

## Этап 4. `entities`

Переносить по одной сущности за PR, в указанном порядке (от независимых к
зависимым). Для каждой сущности: zod-схема и типы из `types/`, api из
`services/`, слайс и thunks из `redux/slices/`, UI-представление, `index.ts`.

### 4.1 `entities/session`
- [ ] Из `types/auth.ts`: `UserStatus`, `UserT`, `AuthState`, `authSchema`.
- [ ] Из `redux/slices/auth`: слайс (accessToken, user) и `checkAuthThunk`.
      Экшены `signin/signup/logout` не удалять, а сделать экшенами сессии
      (`sessionSet`, `sessionCleared`) — сами thunk'и переедут в `features/auth`.
- [ ] Селекторы: `selectSessionUser`, `selectIsLogged`, `selectUserStatus`.
- [ ] Подключить `shared/api/client.ts` к сессии (обновление токена).

### 4.2 `entities/user`
- [ ] `userSchema`, `userProfileSchema`, `userPhotoSchema` из `types/auth.ts` и
      `types/userProfile.ts`.
- [ ] `ui/UserAvatar.tsx` — единственное место с дефолтной картинкой; положить её
      в `public/` вместо внешнего URL pngtree.
- [ ] `api/userApi.ts` — `patchUser` (из `userProfileService`).

### 4.3 `entities/advert`
- [ ] `advertSchema`, `AdvertType` из `types/advert.ts`.
- [ ] `api/advertApi.ts` — `getAdverts`, `getFilteredAdverts`, `getAdvertById`,
      `getTopAdverts`, `createAdvert`. Убрать `try/catch` + `console.log` +
      `Promise.reject` — пусть ошибка просто пробрасывается.
- [ ] Слайс только с данными объявлений: `list`, `current`, `populars`,
      `visibleCount`. Фильтры, теги и лайкнутые **не** сюда.
- [ ] `ui/AdvertCard.tsx` — чистое представление; клик и слот под кнопку лайка
      передаются пропсами (`onClick`, `actions`).

### 4.4 `entities/tag`
- [ ] `tagSchema`, `api/tagApi.ts` (`getTagsBySearch`), слайс `suggestions`.

### 4.5 `entities/like`
- [ ] `likeSchema`, `likedAdvertsSchema` из `types/like.ts`.
- [ ] `api/likeApi.ts`.
- [ ] Слайс: `byAdvert` (лайки текущего объявления) и `likedAdverts` (перенести
      из `advertsSlice.liked`) — это убирает зависимость `advert` → `like`.
      `selectedLike` перенести в локальное состояние фичи удаления.
- [ ] `ui/LikeProfile.tsx` — без `navigate` внутри; кнопку «Написать соседу»
      передавать слотом.
- [ ] Тип `Advert` внутри `likedAdvertsSchema` брать через
      `entities/advert/@x/like.ts`.

### 4.6 `entities/chat`
- [ ] `chatSchema`, `chatListSchema`.
- [ ] `api/chatApi.ts` — список собеседников (из `chatListService`).
- [ ] `model/socket.ts` — **одно** соединение на сессию: открывается, когда
      сессия становится `logged`, закрывается при логауте. Входящие сообщения
      (`SET_USERS`, `SET_MESSAGES`, `ADD_MESSAGE`, `NEW_MESSAGE`) диспатчатся в слайс.
      Реализовать как listener middleware (`createListenerMiddleware`), а не в
      `useEffect` страницы.
- [ ] Типизированный протокол: discriminated union для входящих и исходящих
      сообщений в `model/protocol.ts` (сейчас `payload` приводится через `as`).
- [ ] Слайс: `online`, `messagesByUser`, `dialogs`.
- [ ] `ui/Message.tsx`, `ui/DialogItem.tsx`.

**Готово, когда:** папки `types/` и `services/` пусты и удалены; `redux/slices/`
содержит только то, что уедет в `features`.

---

## Этап 5. `features`

| Фича | Откуда | Что внутри |
|---|---|---|
| `auth/sign-in` | `SignInPage.tsx`, `signinThunk` | форма, thunk, валидация через zod |
| `auth/sign-up` | `SignUpPage.tsx`, `signupThunk` | форма, thunk |
| `auth/logout` | пункт меню в `Navbar.tsx`, `logoutThunk` | кнопка/пункт меню + thunk |
| `advert-filter` | `Filter.tsx`, `filters`/`pickedTags` из `advertsSlice`, синхронизация из `AdvertList.tsx` | см. ниже |
| `tag-search` | debounce-поиск и выбранные теги из `Filter.tsx` | инпут-автокомплит, отдаёт выбранные теги наружу |
| `toggle-like` | `likeHandler` в `AdvertPage.tsx` | кнопка, использует `entities/like` и `entities/session` |
| `create-advert` | `PostAdvertPage.tsx`, `postAdvertThunk` | форма, `api/geocode.ts`, thunk; поля описать массивом-конфигом вместо 10 копий `FormControl` |
| `edit-profile` | форма из `AccountPage.tsx`, `userProfile` slice | форма со схемой zod вместо ручной валидации; слайс `userProfile` удалить — после сохранения обновлять сессию |
| `remove-liked-advert` | `ConfirmDeleteModal.tsx`, `selectedLike` | кнопка + модалка подтверждения |
| `send-message` | `ChatInput.tsx`, `sendNewMessage` из `ChatPage.tsx` | инпут, отправка через `entities/chat` |

### `advert-filter`: один источник правды
- [ ] **URL — единственный источник правды** для фильтров. Состояние фильтров в
      Redux удалить.
- [ ] `model/useAdvertFilters.ts` — читает/пишет `useSearchParams` через
      `shared/lib/url`; включает теги (`tags=1,2,3`).
- [ ] Загрузку объявлений триггерит виджет ленты по изменению параметров, а не
      сам фильтр.
- [ ] Удалить чтение `window.location` из `initialState`.

**Готово, когда:** папка `redux/` удалена; фильтры переживают перезагрузку
страницы и кнопку «Назад».

---

## Этап 6. `widgets` и `pages`

### Widgets
| Виджет | Состав |
|---|---|
| `header` | бывший `Navbar`; навигация на Chakra `Link` вместо `react-bootstrap` (удалить зависимость), `features/auth/logout`, `entities/user` UserAvatar |
| `footer` | `Footer.tsx` |
| `advert-feed` | `AdvertList` + «показать ещё»; `AdvertCard` + `toggle-like` |
| `popular-adverts` | бывший `PopularCard` |
| `advert-info` | содержимое `AdvertPage`: галерея, характеристики, владелец, `toggle-like`, список `LikeProfile`, карта |
| `profile-card` | карточка профиля + `edit-profile` |
| `liked-adverts` | список понравившихся + `remove-liked-advert` |
| `chat-list` | бывший `ChatList` + онлайн-статусы из `entities/chat` |
| `chat-window` | `ChatComponent` + `send-message` |

### Pages
Страница — только композиция виджетов и чтение параметров роута, 20–50 строк.

| Страница | Виджеты |
|---|---|
| `welcome` | статический контент (`WelcomePage.tsx`) |
| `search` | `advert-filter`, `advert-feed`, `popular-adverts` |
| `advert-details` | `advert-info` |
| `advert-create` | `create-advert` |
| `account` | `profile-card`, `chat-list`, `liked-adverts` |
| `chat` | `chat-list`, `chat-window` |
| `sign-in` / `sign-up` | соответствующие фичи |

- [ ] Страницы подключить в роутере через `React.lazy` (код-сплиттинг по роутам).

**Готово, когда:** папка `components/` удалена.

---

## Этап 7. Закрепление

- [ ] Steiger в строгом режиме, добавить в `npm run lint`:
      `"lint": "eslint src --ext ts,tsx --max-warnings 0 && steiger src"`.
- [ ] Запрет глубоких импортов через ESLint `no-restricted-imports`
      (паттерны `@/*/*/*` кроме `@/shared/*/*`).
- [ ] Обновить `CLAUDE.md` в корне репозитория: новая структура и правила импорта.
- [ ] Удалить неиспользуемые зависимости: `react-bootstrap`, `reactstrap`,
      `@types/reactstrap`, `bootstrap` (если CSS больше не используется).

---

## Этап 8 (опционально). RTK Query

После миграции основная масса слайсов в `entities` будет кешем серверных данных.
Их можно заменить на RTK Query:

- `shared/api/baseApi.ts` — `createApi` с `baseQuery` поверх axios-инстанса
  (сохраняет логику refresh токена);
- в каждой сущности — `baseApi.injectEndpoints(...)` в `entities/*/api/`;
- `providesTags`/`invalidatesTags` для лайков и объявлений — уйдут ручные
  перезапросы вроде `getLikedAdvertsThunk` после удаления лайка;
- ручные слайсы останутся только у `session` и `chat` (сокет).

Делать отдельным этапом, по одной сущности, после того как структура FSD
устоялась.

---

## Смоук-тест после каждого этапа

- [ ] Регистрация, вход, выход; перезагрузка страницы сохраняет сессию.
- [ ] `/home`: лента грузится, «показать ещё» работает, фильтры и теги применяются
      и сохраняются в URL.
- [ ] `/advert/:id`: фото, карта, лайк/дизлайк, список лайкнувших.
- [ ] `/post`: создание объявления с фото, редирект; гость перенаправляется на `/signin`.
- [ ] `/account`: редактирование профиля с фото, список чатов, удаление из понравившихся.
- [ ] `/chat/:id`: история загружается, сообщения приходят в реальном времени у
      обоих участников.

# GETSOSED: журнал интеграции нового UI

Дата исходной проверки: 16 октября 2026 года. Основной документ — [план интеграции](redesign-migration-plan.md).

**Выполнены M01–M06. Следующая задача — M07.** Код и API/БД-контракты остаются непроверенными в runtime из-за недоступного локального окружения.

## 1. Исходное состояние

| Пункт | Результат проверки |
| --- | --- |
| Ветка | `redesign/preparations` |
| Исходный HEAD | `5f6f05c` — `redesign: edit plan` |
| Рабочее дерево до M01 | Чистое; ветка на один коммит впереди локальной ссылки `origin/redesign/preparations`. Fetch не выполнялся. |
| Инструкции | Прочитаны корневой AGENTS.md, ARCH.md и карточка M01. В `client/`, `server/`, `docs/` дополнительных AGENTS.md не обнаружено. |
| Зависимости | `client/node_modules` и `server/node_modules` существуют; установка не потребовалась. Node.js `v24.21.0`. |
| Рабочий frontend | `client/src/main.tsx` → `app/App.tsx` → `app/router/router.tsx` → `app/layouts/BaseLayout.tsx`; старые страницы и Chakra. |
| Preview | Отдельный `client/preview.html`; новые представления находятся в проектных слоях, демонстрационные данные — в `client/src/preview/`. |
| Новая инфраструктура | `client/src/shared/config/routes.ts` и `client/src/pages/not-found/` ещё не созданы; по уточнённому плану оба результата относятся к M02. |

Текущее дерево маршрутов проверено в [router.tsx](../client/src/app/router/router.tsx): `/`, `/home`, `/advert/:id`, `/post`, `/account`, `/chat/:receiverId`, `/signin`, `/signup`; неизвестный путь ведёт на `/`. Защищённые страницы отправляют гостя на `/signin` без сохранения назначения. `/about`, отдельного редактирования и индекса сообщений в рабочем router пока нет.

## 2. Проверки до изменений

Команды запускались из `client/` на исходном коде M01.

| Команда | Результат |
| --- | --- |
| `npm test` | PASS, код 0: 24 файла, 50 тестов. |
| `npm run lint` | PASS, код 0; `FSD boundaries: OK`. |
| `npm run build` | PASS, код 0; TypeScript и Vite production build завершены. |

Исходных падений этих проверок нет. Число тестов — снимок этого запуска, а не постоянный критерий плана. Сборка обновила игнорируемый `server/dist`; отслеживаемые файлы приложения не изменились.

Уже существующие предупреждения:

- Sass сообщает об устаревшем `legacy-js-api` при тестах.
- Rollup удаляет неподходящие `/*#__PURE__*/`-аннотации из зависимости `@pbe/react-yandex-maps`.
- Vite предупреждает, что `server/dist` находится вне client root и автоматически не очищается.
- Основной JS chunk около 673 kB, больше рекомендованного порога 500 kB.

Предупреждения не стали ошибками команд. Они не исправлялись в M01; влияние зависимостей/provider и сборки нужно повторно оценить в M28/Q03. Серверный `npm test` не запускался: в package.json это заведомо завершающаяся с ошибкой заглушка.

## 3. Доступность API и БД

| Проверка | Фактический результат |
| --- | --- |
| GET `http://127.0.0.1:3000/api/adverts` | `ECONNREFUSED`, HTTP-ответ не получен. |
| GET `http://127.0.0.1:3000/api/adverts/tags?query=` | `ECONNREFUSED`, HTTP-ответ не получен. |
| TCP `127.0.0.1:5432` | `ECONNREFUSED`; PostgreSQL на этом локальном адресе/порту недоступен. |
| `server/.env` | Отсутствует. Имеется `server/.env.exmaple` с именами переменных. |
| Development-конфигурация БД | `server/config/database.js` загружается; database/username/password/host не заполнены в проверенном окружении. |
| Секреты токенов | `ACCESS_TOKEN_SECRET` и `REFRESH_TOKEN_SECRET` не заданы в проверенном окружении. Значения секретов не выводились. |
| Аутентификация в БД / чтение таблиц | Не выполнялись: отсутствует конфигурация подключения. Применённые миграции и содержимое БД не подтверждены. |

Первая сетевая попытка получила `EPERM` в песочнице. После разрешённого повторного запуска вне песочницы получен именно `ECONNREFUSED`; вывод о недоступности этих портов основан на повторной проверке. Это не утверждение об отсутствии PostgreSQL на машине или удалённой БД.

Проверки были читающими: HTTP GET и TCP connect. API-процессы не запускались; регистрация, запись данных, миграции и `npm run db` не выполнялись.

Перед проверками реальных сценариев будущему исполнителю нужно настроить локальное окружение по шаблону, указать `DB_USER`, `DB_NAME`, `DB_HOST`, `DB_PASS`, секреты токенов и доступный PostgreSQL. Конфигурация Sequelize находится в [server/config/database.js](../server/config/database.js), пути CLI — в [server/.sequelizerc](../server/.sequelizerc). Не искать её в `server/db/config/database.js`: такого файла нет.

Клиент использует `/api` по умолчанию, а WebSocket — origin страницы с путём `/ws`. Vite проксирует `/api`, `/images`, `/ws` на порт 3000; переопределения описаны в [env.ts](../client/src/shared/config/env.ts). Проверки публикации и карты дополнительно зависят от настройки геокодирования; его runtime-доступность в M01 не проверена.

Отсутствие локального backend допускается критерием M01. Оно оставляет непроверенными серверные сценарии M11/M18/M22/M24/M27/M28; эти задачи пока имеют TODO, а не DONE или автоматически BLOCKED.

## 4. Текущие контракты по исходникам

Все HTTP-адреса ниже содержат `/api`, который монтируется в [server/src/app.js](../server/src/app.js). Axios-сервисы используют относительные пути без этого префикса. Указанные статусы взяты из обработчиков, не из полученных HTTP-ответов.

### Авторизация и регистрация

Источники: [authRouter.js](../server/src/router/authRouter.js), [tokensRouter.js](../server/src/router/tokensRouter.js), [authService.ts](../client/src/entities/session/api/authService.ts), [auth.ts](../client/src/entities/session/model/auth.ts), [HTTP-клиент](../client/src/shared/api/client.ts).

| Запрос | Фактическая обработка и ответ | Отличие целевого поведения |
| --- | --- | --- |
| POST `/api/auth/login` | JSON `{email,password}`. Успех 200 `{user,accessToken}` и refresh-cookie; неверные данные 401. User читается с UserProfile, hashpass удаляется. | Перенос на SignInCard и возврат по returnTo ещё не выполнены — M03/M10. |
| POST `/api/auth/signup` | Multipart: name/email/password, gender, файл `file`. Сервер проверяет длину пароля от 9, создаёт User, затем безусловно читает `req.file.buffer`, создаёт UserProfile и возвращает 200 `{user,accessToken}` с cookie. | Без file обработчик падает после создания User. Проверки цифры в пароле на сервере нет; нужны M11/M12. |
| Повторная регистрация email | `findOrCreate` при существующем User даёт 403. | Axios считает каждый 403 основанием refresh; для конфликта email нужен отдельный 409 в M11. |
| GET `/api/tokens/refresh` | Refresh-cookie; возвращает 200 `{user,accessToken}` с актуальным UserProfile и новой cookie. Ошибка внутри handler даёт 501; проверка cookie выполняется middleware. | Новые поля профиля должны пройти client schema после M18. Runtime refresh не проверен. |
| GET `/api/auth/logout` | Очищает refresh-cookie, возвращает 200 без JSON. | Новый layout должен ожидать logoutThunk и отображать ошибку — M06. |

Клиентская authSchema требует `user.id/name/email/roleId` и строковый accessToken. UserProfile необязателен, но `null` сейчас не принимается; его поля about/age/gender/photo/phoneNumber допускают null. signUpSchema всё ещё требует gender, хотя thunk уже принимает произвольный FormData. AuthService заменяет исходные ошибки на общие `Login error`/`Signup error`; для различимого сообщения о занятом email обработку нужно уточнить в M12.

### Профиль

Источники: [userRouter.js](../server/src/router/userRouter.js), [userController.js](../server/src/controllers/userController.js), [userService.js](../server/src/service/userService.js), [UserProfile](../server/db/models/userprofile.js), [userProfileService.ts](../client/src/features/edit-profile/userProfileService.ts), [новая форма](../client/src/features/edit-profile/ui/profile-edit-form/ProfileEditForm.tsx).

| Запрос / данные | Фактический контракт | Что требуется далее |
| --- | --- | --- |
| PATCH `/api/users/:userId` | Multipart, файл `photo`; автор определяется из токена. req.body передаётся в существующий UserProfile.update; затем возвращается User с UserProfile. При исключении controller только логирует ошибку и не отправляет ответ. | M18: явные ответы об ошибках, проверка route ID, allowlist полей, согласованное обновление User и UserProfile. |
| Клиентский вызов PATCH | Берёт `id` из FormData для URL, возвращает `Promise<void>`, тело ответа игнорируется. Старая форма потом вызывает checkAuthThunk. | M20: разобрать ответ userSchema и обновить пользователя без потери accessToken. |
| Сохраняемые поля | User: name/email/roleId; UserProfile: about/age/gender/photo/phoneNumber. Текущий editUser обновляет только UserProfile. | name новой формы сейчас не обновляется; city/intent/habits отсутствуют в модели и миграциях — M18. |
| Новая форма preview | name/city/intent/description/habits; avatarFile имеет File/null/undefined. | description → about; habits → JSON-массив; удаление через removePhoto ещё не поддерживается. Возраст/телефон добавить в новую форму по M20. |
| Чтение профиля | Текущая сессия из login/refresh; отдельного профиля по GET `/users/:id` нет. | Не использовать этот GET для профиля: сейчас он возвращает список диалогов. |
| Собственные объявления | GET `/api/adverts/mine` отсутствует. | Добавить в M18 перед динамическим `/:advertId`. |

Схемы UserProfiles/Adverts/Locations проверены по файлам миграций, а не через живую БД. Новая миграция city/intent/habits ещё не существует; применённое состояние любой пользовательской БД неизвестно.

### Объявления и фотографии

Источники: [advertRouter.js](../server/src/router/advertRouter.js), [advertController.js](../server/src/controllers/advertController.js), [advertService.js](../server/src/service/advertService.js), [advert.ts](../client/src/entities/advert/model/advert.ts), [клиентский сервис](../client/src/entities/advert/api/advertService.ts), [ListingDraft](../client/src/features/listing-create/model.ts).

| Запрос | Фактический ответ / обработка | Разрыв |
| --- | --- | --- |
| GET `/api/adverts` | 200, массив Advert с User, Location, AdvertPhotos; сортировка id ASC. В этом методе hashpass удаляется. | tags не включаются; это не сортировка свежих по createdAt — M07/M13. |
| GET `/api/adverts/:advertId` | 201, объект Advert с User/Location/AdvertPhotos; для отсутствующей записи возможно 201 с null. | Нужны 200/404; tags не включаются, разрешённые поля автора не ограничены — M07. |
| POST `/api/adverts/filters` | 200, массив Advert с User/Location/AdvertPhotos и tags. | Client advertSchema не описывает tags и отбрасывает их при parse — M07. |
| GET `/api/adverts/top` | 200, до четырёх объявлений по числу лайков; фото и Location включены. | Не использовать как свежую подборку — M13. |
| GET `/api/adverts/liked` | Защищённый запрос; 200, массив `{id,userId,advertId,Advert}`. Вложенный Advert загружается с User/Location. | Фото и tags не включены; ими нельзя заполнить новые карточки без M07. |
| POST `/api/adverts` | Защищённый multipart, до 10 файлов `files`; поля title/body/price/floor/square/rooms/city/district/address/metro/coordinates. userId берётся из токена. Создаёт Advert и Location, затем обрабатывает фото. | tagIds не читаются. Проверка наличия фото выполняется после создания объявления; фото сохраняются через не ожидаемый forEach(async). Ответ 201 содержит User/Location без готового массива фото — M22. |

Клиентский advertSchema сейчас требует числовые price/floor/rooms/square, непустую по типу Location со строковыми city/district/address/metro/coordinates и автора с id/name/email. AdvertPhotos допускается отсутствующим/null. Миграции не запрещают null во многих этих столбцах; какие null реально есть в БД, не проверено. Разрешение отсутствующих координат из M23 требует целевого изменения схемы и потребителей в M07, иначе успешный POST может завершиться ошибкой Zod на клиенте.

Текущий ListingDraft содержит только title/city/metro/area/price/description/rules. Нет rooms/floor/address/district; rules — строки. Условия продолжения требуют метро, а наличие фото перед отправкой не проверяется. M21 добавляет реальные поля/валидацию, M23 преобразует `area → square`, `description → body`, выбранные ID → JSON `tagIds`, реальные File → повторяющееся `files`.

Лимиты по исходникам:

| Место | Текущее поведение | Целевой контракт |
| --- | --- | --- |
| PhotosStep | Явно передаёт `maxFiles={8}`, `maxFileSizeMb={5}`. | M21: явно 1–10 фото до 10 МБ, JPG/PNG/WebP. |
| UploadArea defaults | 8 файлов, 10 МБ, любые MIME `image/*`. | Общий компонент остаётся настраиваемым; ограничения сценария передаются props. |
| Серверный multer | `upload.array('files',10)`, лимит 10 МБ на файл, проверка MIME через includes('image'). В ветке неподходящего MIME callback не вызывается. | M22: одинаковый контракт, проверка декодирования и явное завершение отклонённого запроса. |

### Теги и фильтры

Источники: [filters.ts](../client/src/features/advert-filter/model/filters.ts), [SearchFilterValues](../client/src/features/advert-filter/model/searchFilterValues.ts), серверный advertService и [seeder тегов](../server/db/seeders/20240827092605-Tags.js).

| Запрос / хранение | Текущий контракт |
| --- | --- |
| GET `/api/adverts/tags?query=<строка>` | 200, массив `{id,name,...}`; поиск через iLike. Для всего каталога передавать явно пустую строку query. |
| URL поиска | city/district/metro, priceFrom/priceTo, roomsFrom/roomsTo, tags как строка числовых ID через запятую. readFilters превращает отсутствующие/неположительные числа в 0. |
| POST фильтров | Числовые границы и строки местоположения, `tags: [{id,name:''}]`. Сервер удаляет повторные ID и требует совпадения всех выбранных тегов. |
| Новые preview-фильтры | Только верхняя цена/нижние комнаты и строковые conditions, без priceFrom/roomsTo и произвольных tag ID. Требуется M15. |
| Набор быстрых условий | В seeders есть «Для некурящих» и «Питомцы разрешены». «Тихие вечера» и «С рабочим местом» не найдены; состояние живого каталога не проверено. Требуется M08. |

Фильтрация по реальным ID уже существует; изобретать новый API только для внешнего вида не требуется. При создании объявления связи AdvertTags сейчас не записываются — это отдельная часть M22.

### Избранное и заинтересованные пользователи

Источники: [likeRouter.js](../server/src/router/likeRouter.js), [likeService.js](../server/src/service/likeService.js), [клиентский LikeService](../client/src/entities/like/api/likeService.ts), [likeSchema](../client/src/entities/like/model/like.ts), [likedAdverts](../client/src/features/liked-adverts/model.ts).

| Запрос / состояние | Фактический контракт | Разрыв |
| --- | --- | --- |
| GET `/api/likes/:advertId` | Публичный, 200 массив Like с User и UserProfile; используется для заинтересованных людей. | Не является множеством избранного текущего пользователя — M09/M17. |
| POST `/api/likes/:advertId` | Защищённый, 201 Like при создании. Если запись уже существует, сервис возвращает undefined и controller отправляет 201 без объекта. | Клиент всегда ждёт likeSchema с id/userId/advertId; повторный запрос даёт ошибку разбора — уточнено в M09. |
| DELETE `/api/likes/:advertId` | Защищённый, 200 удалённый Like; при отсутствии записи 200 `{}`. | Тот же parser likeSchema отклоняет `{}` — уточнено в M09. |
| GET избранного | `/api/adverts/liked`, схема включает вложенный Advert. | likedAdverts хранит только items, без pending/error/session guard и синхронизации мутаций. |

Для M09 зафиксировано целевое поведение повторов: POST возвращает существующий Like с 200 либо новый с 201; DELETE всегда возвращает 200 `{advertId,deleted:boolean}`. Это будущая корректировка контракта, не текущий API. Клиентский DELETE-parser/thunk и reducers обновляются вместе, удаление из состояния производится по advertId. Транспорт лайков не должен зависеть от UI или соседних entities.

### Диалоги и WebSocket

Источники: [userService.js](../server/src/service/userService.js), [chatListService.ts](../client/src/entities/chat/api/chatListService.ts), [protocol.ts](../client/src/entities/chat/model/protocol.ts), [socket.ts](../client/src/entities/chat/model/socket.ts), [connection.js](../server/src/ws/connection.js), [App.tsx](../client/src/app/App.tsx).

| Операция | Фактический контракт |
| --- | --- |
| GET `/api/users/:userId` | Сейчас публичный, возвращает массив сообщений, сгруппированных в коде по паре sender/receiver. Клиент читает id/senderId/receiverId/message и sender/receiver с id/name/email. Это не профиль пользователя. |
| Выбор последнего сообщения | В SQL нет order; JS сохраняет первый встретившийся элемент пары. Последний текст и порядок диалогов не гарантированы — M24. |
| Данные нового собеседника | Отдельного `/summary` нет. Прямой новый диалог может не найти имя в chatList — M24/M26/M27. |
| Подключение `/ws` | Сервер проверяет refresh-cookie. Один клиентский chatSocket подключается/отключается из App при изменении сессии. Runtime handshake не проверен. |
| Клиент → сервер: история | `{type:'INITIALIZE',payload:{receiverId}}`. Ответ: `{type:'SET_MESSAGES',receiverId,payload:[Chat]}`. |
| Клиент → сервер: сообщение | `{type:'ADD_MESSAGE',payload:{receiverId,text}}`. Сервер сохраняет Chat и рассылает событие ADD_MESSAGE с записью отправителю и подключённому получателю. В этой ветке сохранение не требует присутствия получателя online. |
| Другие входящие события | SET_USERS с массивом пользователей, NEW_MESSAGE со старой альтернативной ветки SEND_MESSAGE. Текущий клиент отправляет ADD_MESSAGE, не SEND_MESSAGE. |
| Client Chat | id/senderId/receiverId/message. Сохраняется в messagesByUser по ID собеседника; дедупликация по message.id. createdAt из серверных записей текущая Zod-схема отбрасывает. |
| Результат sendMessage | Boolean означает успешный вызов send на открытом socket, а не подтверждённую запись в БД. Отдельного request ID/ack/error-события текущий протокол не содержит. |

Связь с объявлением в модели Chats отсутствует. В preview ChatPage advert/price/time обязательны, а callback открытия использует ID диалога; M25 разделяет эти данные. Время не подставляется произвольно, контекст M27 передаётся через проверенный query и не объявляется постоянной связью чата.

## 5. Сверка плана и уточнения M01

Основные решения раздела 4 плана подтверждены кодом; готовых реализаций M02–M28 не обнаружено. Уточнены следующие карточки, без выполнения их реализации:

| Уточнение | Основание | Где исправлять |
| --- | --- | --- |
| Стабильные ответы повторных операций избранного и новый DELETE-ответ | POST existing → undefined, DELETE missing → `{}`, клиент ждёт Like. | M09, серверные likeController/service и клиентский parser/thunk/reducers. |
| Конфликт email должен возвращать 409, а не 403 | 403 запускает refresh в общем Axios interceptor. | M11; M12 должен сохранить различимый конфликт в сообщении формы. |
| nullable UserProfile и прямой ответ PATCH | hasOne может отсутствовать; текущая схема принимает optional, но не null. ProfileService игнорирует возвращённого пользователя. | M18/M20. |
| Лимит PhotosStep сейчас именно 8 × 5 МБ | Это явные props сценария, отличающиеся от defaults UploadArea 8 × 10 МБ. | M21; целевой 10 × 10 МБ согласовать с M22. |
| Отклонение файла должно завершать запрос | У multer fileFilter отсутствует callback в не-image ветке. | M22. |

Остальные подтверждённые разрывы уже описаны в плане: недостающие поля публикации и профиля; необязательная регистрационная фотография; несогласованные tags/фото в выдаче; `/mine` и summary отсутствуют; stale state деталей и несинхронное избранное; отдельные preview-стили и привязка Drawer к рамке; неподтверждённые композиции V10–V18.

## 6. Исторические снимки

В DESIGN.md найдено 29 ссылок на снимки, 18 файлов по ним доступны, 11 отсутствуют. В `client/docs/screenshots/` всего 67 локальных файлов и 0 отслеживаемых Git: каталог игнорируется правилом `docs/screenshots/` в `client/.gitignore`. В корневом `docs/screenshots/` — 4 файла, все отслеживаются. Эти каталоги не взаимозаменяемы.

Отсутствующие файлы по ссылкам DESIGN.md:

```text
client/docs/screenshots/b01-header-desktop.png
client/docs/screenshots/b01-header-mobile.png
client/docs/screenshots/b02-chat-desktop.png
client/docs/screenshots/b02-layout-desktop.png
client/docs/screenshots/b02-layout-mobile.png
client/docs/screenshots/b03-long-mobile.png
client/docs/screenshots/b03-no-photo-mobile.png
client/docs/screenshots/b03-search-desktop.png
client/docs/screenshots/b04-chat-desktop.png
client/docs/screenshots/b04-chat-mobile.png
client/docs/screenshots/b04-profile-desktop.png
```

Старые файлы не пересоздавались и не принимались за проверку рабочего приложения. В Q01 нужно подготовить новые доступные проверяющему результаты; локальные игнорируемые снимки не перейдут автоматически к исполнителю в другом checkout. Актуальная доступность Figma/опубликованного эталона в M01 не проверялась — это отдельная часть Q01.

## 7. Статусы задач

| ID | Задача | Статус |
| --- | --- | --- |
| M01 | Контракты, исходные проверки и журнал | DONE |
| M02 | Новые адреса без поддержки старых путей | DONE |
| M03 | Назначение после авторизации | DONE |
| M04 | Общие стили и адаптив вне preview | DONE |
| M05 | Независимые overlays | DONE |
| M06 | Новая оболочка приложения | DONE |
| M07 | Чтение объявлений и фотографии | TODO |
| M08 | Настоящие теги условий | TODO |
| M09 | Единое состояние избранного | TODO |
| M10 | Новый вход | TODO |
| M11 | Регистрация без фото на сервере | TODO |
| M12 | Новая регистрация | TODO |
| M13 | Главная с реальными объявлениями | TODO |
| M14 | О сервисе | TODO |
| M15 | Фильтры, URL и каталог тегов | TODO |
| M16 | Новая страница поиска | TODO |
| M17 | Новое объявление, карта и контакт | TODO |
| M18 | Данные профиля и собственные объявления | TODO |
| M19 | Рабочий профиль | TODO |
| M20 | Редактирование профиля | TODO |
| M21 | Поля и валидация публикации | TODO |
| M22 | Серверная публикация с фото/тегами | TODO |
| M23 | Публикация через API | TODO |
| M24 | Список диалогов и собеседник | TODO |
| M25 | ChatPage без демонстрационных предположений | TODO |
| M26 | Маршрут списка сообщений | TODO |
| M27 | История и отправка сообщений | TODO |
| M28 | Реальные сценарии и production-навигация | TODO |
| Q01 | Визуальная сверка и адаптив | TODO |
| Q02 | Доступность и состояния | TODO |
| Q03 | Очистка и закрепление нового UI | TODO |

## 8. Запись выполнения M01

**Выполнено:** проверено исходное состояние, пройдены три обязательные клиентские команды, проверены локальные порты и наличие конфигурации, сверены текущие контракты с целевыми, перечислены отсутствующие снимки, создан журнал и уточнены будущие карточки плана. Для журнала добавлено точечное исключение в корневой `.gitignore`: иначе правило `docs/*` скрывало бы его от Git и следующего исполнителя. Новые исходные тесты и бизнес-код не добавлялись.

**Остаётся непроверенным:** реальные HTTP-ответы и данные PostgreSQL, регистрация/редактирование/публикация, WebSocket-сценарий двух пользователей, актуальное визуальное соответствие дизайну. Причины и будущие задачи указаны выше. Это не мешает завершению M01 по её критерию готовности.

**Передача следующему исполнителю:** M02 завершена. Следующая задача — M03, защита `returnTo` при авторизации. Backend сейчас недоступен; к M03 это не препятствует.

## 9. Уточнение пользователя после M01 и реестр переноса логики

Прежний UI не опубликован в production. Совместимость со старыми браузерными адресами не нужна; план M02 обновлён без redirects и aliases. Итог редизайна — новый дизайн всех экранов с удалением старых UI-файлов. Эти файлы не удаляются заранее: сначала из них переносится и проверяется необходимая бизнес-логика, затем в Q03 выполняется очистка. Это уточнение было внесено после M01 и до начала M02; на тот момент исходники приложения не менялись. Результат последующей реализации M02 зафиксирован в разделе 10.

Каждая задача переноса дополняет реестр. Одной строки на страницу недостаточно, если в ней несколько независимых обработчиков: отдельно указать запросы, преобразования, валидацию, состояние, отправку и переходы. Существующий service/thunk можно переиспользовать без копирования; в графе назначения тогда указывается его текущий путь. Для отброшенной логики записать причину.

| Исходный файл и функция | Назначение логики | Новый файл/функция или переиспользованный модуль | Проверка переноса | Готовность удаления в Q03 |
| --- | --- | --- | --- | --- |
| Заполняется исполнителями M06/M10–M27 при разборе старых компонентов | Ещё не проверено | Ещё не определено | Не выполнена | Нет |

Файл становится кандидатом на удаление только после заполнения реестра, проверки сценария и отсутствия потребителей. Отсутствие импортов, новая похожая форма и сохранность старого кода в истории Git сами по себе не подтверждают перенос логики.

## 10. Выполнение M02

**Сделано:** добавлены `shared/config/routes.ts` с таблицей шаблонов и builders `listingDetails(id)`/`messageThread(receiverId)`; application router переключён на новые пути и возвращает NotFoundPage для прежних адресов и любых неизвестных. Вынесен `pages/not-found` с переходами на главную и поиск. В `AdvertPage` читается `listingId`. Новые пути подключены к существующим страницам там, где новые экраны появятся позднее; бизнес-логика источников сохранена.

Внутренние ссылки профиля, форм авторизации, объявлений, чатов, шапки и футера используют новые адреса. Демонстрационные sample paths и ID отделены в `client/src/preview/routes.ts`; в шапке больше нет тестового ID объявления или чата. Старые пути не имеют redirect/alias и отображают 404 с сохранением исходного URL. Клик по 404 ведёт на выбранное новое назначение.

**Проверки:** `npm test -- --reporter=dot` — PASS, 27 файлов/66 тестов; включены проверки matchRoutes, 404, legacy paths и ID builders. `npm run lint` — PASS, FSD boundaries OK. `npm run build` — PASS. Сборка сохранила уже существующие предупреждения Sass/Rollup и размер JS chunk; новый build error отсутствует.

**Не проверено:** server/API runtime по ограничениям M01; M02 не делает серверных запросов. Старые UI-файлы специально сохранены. Их миграция логики фиксируется в реестре раздела 9, удаление остаётся за Q03.

## 11. Выполнение M04 и M06

Проверка M02 показала, что новый router всё ещё рендерил старый BaseLayout. В приложении использовались старые Navbar/Footer, тогда как SiteLayout применялся только в preview. M04 и M06 выполнены досрочно, чтобы основное приложение сразу получило готовую оболочку.

**M04:** общие Inter/CSS foundations подключены из `client/src/shared/styles/foundations.module.scss` в обычный app entrypoint. Preview forwarding stylesheet использует те же foundations. SiteLayout стал inline-size container для responsive-правил; в `.shell` зафиксированы цветовая основа и font-family нового интерфейса.

**M06:** новый `client/src/app/layouts/app-layout/AppLayout.tsx` подключён в router вместо BaseLayout. Он передаёт сессию в SiteHeader, вызывает текущий logoutThunk, показывает ошибку выхода, использует новый SiteFooter и мобильную навигацию. SiteHeader/SiteFooter скрывают страницы без смонтированного route; About, редактирование профиля и индекс сообщений добавляются соответствующими M14/M20/M26. Bottom navigation учитывает safe area; диалог открывает fullscreen chat layout без футера. BaseLayout.tsx, Navbar.tsx и старый Footer сохранены до Q03.

**Визуальная проверка оболочки:** основной `http://127.0.0.1:5173/` открыт в in-app browser. Проверены viewport 1440 × 900, 390 × 844 и 320 × 720. На 1440 показаны новая desktop-шапка и footer; на 390/320 — мобильная шапка и нижняя навигация. `document.documentElement.scrollWidth` совпадает с viewport во всех трёх размерах. Menu/footer не показывают ссылки на ещё не подключённые страницы.

**Проверки после M04/M06:** `npm test` — PASS, 28 файлов/69 тестов; `npm run lint` — PASS, `FSD boundaries: OK`; `npm run build` — PASS. Build по-прежнему сообщает известные Sass/Rollup/outDir/chunk-size предупреждения; новых build ошибок нет.

Содержимое главной пока по-прежнему рендерит прежний WelcomePage. Задача M13 подключит подготовленный новый экран главной. Остальные старые screen components также заменяются по карточкам соответствующих M-задач, а файлы сохраняются до Q03.

## 12. Выполнение M03

**Сделано:** добавлен `client/src/shared/lib/navigation/safe-return-to.ts`. Helper принимает только локальный путь, не допускает внешний origin, protocol-relative/backslash адреса, неверный percent-escape и повторное открытие sign-in/sign-up. Возвращает исходный pathname/query/hash; при отклонённом или отсутствующем значении безопасным default служит `/profile`. При переключении форм безопасное значение сериализуется в query параметр returnTo.

ProtectedRoute теперь показывает UI kit Spinner на Pending. Гостевой доступ к protected route переходит на sign-in с исходным адресом. Logged пользователь, открывающий sign-in/sign-up, возвращается по безопасному returnTo либо в профиль. SignInForm и SignUpForm используют одинаковый post-auth helper и сохраняют returnTo между формами.

**Тесты:** добавлены 11 проверок safe-return helper, 6 сценариев ProtectedRoute и тест переключения auth-форм через header для исходного query/hash, безопасного возврата к диалогу, external/protocol-relative/auth-loop targets и Pending state. Общее состояние проверки M03: `npm test` — PASS, 30 файлов/88 тестов; `npm run lint` — PASS, `FSD boundaries: OK`; `npm run build` — PASS. Сборка сохраняет прежние предупреждения Sass/Rollup/outDir/large chunk.

## 13. Выполнение M05

**Сделано:** из `Dialog` удалены `getBoundary`, состояние позиции, обработчик resize/scroll и вычисляемый inline style. Из `Drawer`, `SearchFilters` и preview удалён весь pass-through `getDrawerBoundary`; Drawer теперь использует общие viewport-стили и portal в `document.body`. Escape, закрытие по backdrop, focus trap/restoration и блокировка прокрутки сохранены. Обновлены каталог UI kit и описание поиска в `client/DESIGN.md`.

**Тесты:** overlay-тест проверяет, что Drawer внутри элемента `preview-frame` размещается в portal под `document.body`, не получает inline-позиционирование, удерживает Tab-фокус внутри панели и закрывается по backdrop. Существующие проверки Escape, scroll lock, возврата фокуса и SearchFilters проходят. Полный `npm test -- --reporter=dot` — PASS, 30 файлов/88 тестов; после добавления проверки Tab trap отдельно повторён overlay-тест — PASS, 1 файл/3 теста. `npm run lint` — PASS, `FSD boundaries: OK`; `npm run build` — PASS. Сборка сообщает прежние Sass/Rollup/outDir/chunk-size предупреждения.

**Граница проверки:** SearchFilters пока не подключён к production-странице поиска (это M16), поэтому визуальная проверка Drawer в рабочем пользовательском сценарии запланирована вместе с подключением этого экрана. В M05 проверены независимость компонента от preview-рамки и его поведение в тестах.

**Передача следующему исполнителю:** M05 завершена. Следующая задача — M07, чтение объявлений и фотографий с учётом реального API-контракта.

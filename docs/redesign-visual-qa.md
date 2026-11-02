# Q01 · Визуальная сверка и адаптив GETSOSED

Дата проверки: **1 ноября 2026 года**. Статус: **DONE**.

Все рабочие страницы проверены на 1440/1024/768/390 px и на переполнение/доступность
действий при 320 px. Найденные дефекты исправлены. Состав экранов, данные и
обоснованные отличия от демонстрационных макетов зафиксированы ниже и в
[DESIGN.md](../client/DESIGN.md). Q02 и Q03 остаются TODO.

## Эталоны и метод

- [Опубликованный макет](https://getsosed-visualization-2026.heartyfawn5.chatgpt.site),
  версия 1; доступ и версия подтверждены через браузер и Sites 1 ноября.
  Source commit: `305c15617372fcbd1c417c40efc3c3c226764a71`.
  Приоритет для главной, поиска, деталей, About, входа и регистрации.
  Внутренние режимы 1440/1024/390 проверены без принятия масштаба внешней рамки за CSS-размеры.
- Figma: [профиль 4:273](https://www.figma.com/design/SmkHHTyUKc5FWCpf9dhU8y?node-id=4-273),
  [сообщения 4:222](https://www.figma.com/design/SmkHHTyUKc5FWCpf9dhU8y?node-id=4-222),
  [публикация 4:326](https://www.figma.com/design/SmkHHTyUKc5FWCpf9dhU8y?node-id=4-326).
  Для всех получены design context и изображение; Figma не редактировалась.
- Основная матрица: рабочий Vite-клиент, Express и настоящая development-БД.
  Профиль/избранное/переписка/публикация проверялись на синтетических аккаунтах.
  Карта и заинтересованные — на существующем объявлении с координатами, без изменения его данных.
- В Chrome выставлялся настоящий viewport; сохранённые JPEG имеют соответствующую
  ширину. [Измерения](redesign-qa/measurements.json) содержат источник, состояние,
  фактические размеры и файл каждого снимка. Full-page снимок сохраняет всю страницу;
  fixed-навигация на нём находится в позиции первого viewport, а не внизу длинного изображения.

## Снимки эталонов

| Экран сайта | Режимы эталона |
| --- | --- |
| Главная | [1440](redesign-qa/reference-home-1440.jpg) · [1024](redesign-qa/reference-home-1024.jpg) · [390](redesign-qa/reference-home-390.jpg) |
| Поиск | [1440](redesign-qa/reference-search-1440.jpg) · [1024](redesign-qa/reference-search-1024.jpg) · [390](redesign-qa/reference-search-390.jpg) |
| Объявление | [1440](redesign-qa/reference-detail-1440.jpg) · [1024](redesign-qa/reference-detail-1024.jpg) · [390](redesign-qa/reference-detail-390.jpg) |
| About | [1440](redesign-qa/reference-about-1440.jpg) · [1024](redesign-qa/reference-about-1024.jpg) · [390](redesign-qa/reference-about-390.jpg) |
| Вход | [1440](redesign-qa/reference-signin-1440.jpg) · [1024](redesign-qa/reference-signin-1024.jpg) · [390](redesign-qa/reference-signin-390.jpg) |
| Регистрация | [1440](redesign-qa/reference-signup-1440.jpg) · [1024](redesign-qa/reference-signup-1024.jpg) · [390](redesign-qa/reference-signup-390.jpg) |

Figma: [профиль](redesign-qa/reference-figma-profile.png), [чат](redesign-qa/reference-figma-chat.png), [публикация](redesign-qa/reference-figma-post.png).

## Матрица рабочих экранов

Ссылки в каждой строке — снимки после исправлений; результат всех строк — PASS.
Основные высоты: 1000 px для desktop/tablet, 844 px для телефона.
Состояние по умолчанию — данные; отдельно подписаны пустые фото и отсутствие выбора диалога.

| Экран / маршрут | Данные / эталон | 1440 | 1024 | 768 | 390 | 320 | Результат |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Главная `/` | API / сайт | [снимок](redesign-qa/home-1440.jpg) | [снимок](redesign-qa/home-1024.jpg) | [снимок](redesign-qa/home-768.jpg) | [снимок](redesign-qa/home-390.jpg) | [снимок](redesign-qa/home-320.jpg) | PASS |
| Поиск `/listings` | API / сайт | [снимок](redesign-qa/search-1440.jpg) | [снимок](redesign-qa/search-1024.jpg) | [снимок](redesign-qa/search-768.jpg) | [снимок](redesign-qa/search-390.jpg) | [снимок](redesign-qa/search-320.jpg) | PASS |
| Объявление `/listings/:listingId` | API / сайт | [снимок](redesign-qa/detail-1440.jpg) | [снимок](redesign-qa/detail-1024.jpg) | [снимок](redesign-qa/detail-768.jpg) | [снимок](redesign-qa/detail-390.jpg) | [снимок](redesign-qa/detail-320.jpg) | PASS |
| Карта и заинтересованные `/listings/1` | API / сайт | [снимок](redesign-qa/detail-map-1440.jpg) | [снимок](redesign-qa/detail-map-1024.jpg) | [снимок](redesign-qa/detail-map-768.jpg) | [снимок](redesign-qa/detail-map-390.jpg) | [снимок](redesign-qa/detail-map-320.jpg) | PASS |
| About `/about` | API / сайт | [снимок](redesign-qa/about-1440.jpg) | [снимок](redesign-qa/about-1024.jpg) | [снимок](redesign-qa/about-768.jpg) | [снимок](redesign-qa/about-390.jpg) | [снимок](redesign-qa/about-320.jpg) | PASS |
| Вход `/sign-in` | API / сайт | [снимок](redesign-qa/signin-1440.jpg) | [снимок](redesign-qa/signin-1024.jpg) | [снимок](redesign-qa/signin-768.jpg) | [снимок](redesign-qa/signin-390.jpg) | [снимок](redesign-qa/signin-320.jpg) | PASS |
| Регистрация `/sign-up` | API / сайт | [снимок](redesign-qa/signup-1440.jpg) | [снимок](redesign-qa/signup-1024.jpg) | [снимок](redesign-qa/signup-768.jpg) | [снимок](redesign-qa/signup-390.jpg) | [снимок](redesign-qa/signup-320.jpg) | PASS |
| Профиль `/profile` | API / Figma | [снимок](redesign-qa/profile-1440.jpg) | [снимок](redesign-qa/profile-1024.jpg) | [снимок](redesign-qa/profile-768.jpg) | [снимок](redesign-qa/profile-390.jpg) | [снимок](redesign-qa/profile-320.jpg) | PASS |
| Редактирование `/profile/edit` | API / проектное решение | [снимок](redesign-qa/profile-edit-1440.jpg) | [снимок](redesign-qa/profile-edit-1024.jpg) | [снимок](redesign-qa/profile-edit-768.jpg) | [снимок](redesign-qa/profile-edit-390.jpg) | [снимок](redesign-qa/profile-edit-320.jpg) | PASS |
| Список сообщений `/messages` | API / Figma | [снимок](redesign-qa/messages-1440.jpg) | [снимок](redesign-qa/messages-1024.jpg) | [снимок](redesign-qa/messages-768.jpg) | [снимок](redesign-qa/messages-390.jpg) | [снимок](redesign-qa/messages-320.jpg) | PASS |
| Переписка `/messages/:receiverId` | API / Figma | [снимок](redesign-qa/conversation-1440.jpg) | [снимок](redesign-qa/conversation-1024.jpg) | [снимок](redesign-qa/conversation-768.jpg) | [снимок](redesign-qa/conversation-390.jpg) | [снимок](redesign-qa/conversation-320.jpg) | PASS |
| Публикация: комната `/listings/new` | API / Figma + контракт | [снимок](redesign-qa/post-1-1440.jpg) | [снимок](redesign-qa/post-1-1024.jpg) | [снимок](redesign-qa/post-1-768.jpg) | [снимок](redesign-qa/post-1-390.jpg) | [снимок](redesign-qa/post-1-320.jpg) | PASS |
| Публикация: цена `/listings/new` | API / проектное решение | [снимок](redesign-qa/post-2-1440.jpg) | [снимок](redesign-qa/post-2-1024.jpg) | [снимок](redesign-qa/post-2-768.jpg) | [снимок](redesign-qa/post-2-390.jpg) | [снимок](redesign-qa/post-2-320.jpg) | PASS |
| Публикация: фото, пусто `/listings/new` | API / проектное решение | [снимок](redesign-qa/post-3-empty-1440.jpg) | [снимок](redesign-qa/post-3-empty-1024.jpg) | [снимок](redesign-qa/post-3-empty-768.jpg) | [снимок](redesign-qa/post-3-empty-390.jpg) | [снимок](redesign-qa/post-3-empty-320.jpg) | PASS |
| 404 `неизвестный адрес` | API / проектное решение | [снимок](redesign-qa/404-1440.jpg) | [снимок](redesign-qa/404-1024.jpg) | [снимок](redesign-qa/404-768.jpg) | [снимок](redesign-qa/404-390.jpg) | [снимок](redesign-qa/404-320.jpg) | PASS |

Общие листы для обзора: [1440](redesign-qa/contact-1440.jpg), [1024](redesign-qa/contact-1024.jpg), [768](redesign-qa/contact-768.jpg), [390](redesign-qa/contact-390.jpg).

## Состояния и overlays

В каждой строке проверены текст, переносы, видимость действий и отсутствие
переполнения страницы на desktop/mobile.

| Экран / состояние | Источник | Снимки | Результат |
| --- | --- | --- | --- |
| Пустой поиск по несуществующему городу | API | [1440](redesign-qa/search-empty-api-1440.jpg) · [390](redesign-qa/search-empty-api-390.jpg) | PASS |
| Ошибки первого шага | API | [1440](redesign-qa/post-1-error-1440.jpg) · [390](redesign-qa/post-1-error-390.jpg) | PASS |
| Ошибки цены и описания | API | [1440](redesign-qa/post-2-error-1440.jpg) · [390](redesign-qa/post-2-error-390.jpg) | PASS |
| Все условия в мобильном Drawer | API | [390](redesign-qa/filters-drawer-390.jpg) · [320](redesign-qa/filters-drawer-320.jpg) | PASS |
| Меню гостя | API | [320](redesign-qa/guest-menu-320.jpg) | PASS |
| Полноэкранное фото | API | [1440](redesign-qa/gallery-lightbox-1440.jpg) · [390](redesign-qa/gallery-lightbox-390.jpg) · [320](redesign-qa/gallery-lightbox-320.jpg) | PASS |

Реальное фото выбрано во встроенном браузере; пройдены обзор, POST и открытие
возвращённого ID. Его viewport — **857 px**, он не выдаётся за контрольную ширину:
[выбранный File](redesign-qa/post-3-upload-iab-857.jpg),
[обзор](redesign-qa/post-4-review-iab-857.jpg),
[результат](redesign-qa/post-result-iab-857.jpg).

## Исправленные дефекты

| Дефект до Q01 | Решение и проверка |
| --- | --- |
| Баннер главной крупнее опубликованного эталона, другая фотография; высоту задавал размер изображения | Фото из версии 1, заголовки 43/31 px, desktop-минимум 315 px. Изображение внутри отдельной обёртки; длинный текст увеличивает блок без обрезки. Фото проверено в Vite и production. |
| Новый статический ресурс попадал под `/images` API-прокси и возвращал 404 | Файл размещён как `/redesign-hero.jpg` в корне public. Проверены naturalWidth и production-загрузка. |
| Поиск использовал неоформленный native h1 и терял пояснение | Введены 34/27 px, пояснение и согласованный интервал перед выдачей. |
| Профиль не соответствовал desktop-композиции Figma | Широкая карточка пользователя, аватар 76 px, заголовок 42/27 px, избранное слева и свои объявления справа; ниже 1000 px блоки складываются. |
| Кнопка заинтересованного пользователя создавала +31 px ширины на телефоне | Мобильная full-width раскладка action ограничена вариантом Profile; компактная строка сохраняет собственную ширину. Повторная проверка объявления с картой: 320/390 без переполнения. |
| Длинная история увеличивала страницу; сообщения могли сжиматься | Chat-layout ограничен 100dvh; scroll истории внутри панели, сообщения flex-shrink: 0. Автопрокрутка учитывает чтение старых сообщений и resize. |
| Контекст объявления вытеснял composer на коротком экране | При высоте до 600 px компактный контекст, скрыты быстрые фразы, уменьшены интервалы. Composer не обрезан родителем и не перекрыт навигацией. |
| Гость видел только три пункта нижней панели | Все пять пунктов; защищённый переход сохраняет returnTo. |
| Публикация одновременно выделяла Поиск | Исправлен active state; добавлен адресный поведенческий тест. |
| Часть рабочих экранов не имела h1 | Главная, About, детали и auth получили основной h1; сохранена иерархия секций. |
| Stepper обрезал названия последних шагов на 320 px | Все четыре шага помещаются с переносами; форма до 880 px, номер шага под заголовком, единая типографика шагов 29/22 px. |

## Решения для отсутствующих в макете частей

- **Общая оболочка:** цвета, Inter и шапка опубликованного сайта приоритетнее
  старой Figma с Arimo и высотой шапки 78 px. Для авторизованного вида сохранена
  общая геометрия, доступны профиль и публикация.
- **Профиль:** реальные собственные объявления заменяют статическую заглушку Figma;
  избранное, счётчики, retry и действие сообщений сохранены. Редактирование —
  отдельная форма в UI kit по существующему API, включая поля вне Figma.
- **Чат:** отдельные мобильные виды списка/беседы, реальный optional-контекст,
  отсутствие автоматического выбора собеседника. Текущие быстрые фразы оставлены
  как рабочие действия; на низком viewport приоритет у composer и истории.
- **Публикация:** адрес, район, комнаты и этаж сохранены ради контракта.
  Цена/правила, фотографии и обзор приняты как последовательные проектные шаги
  в том же UI kit. В Figma есть их названия в Stepper, отдельных макетов нет.
- **Карта поиска:** штрихованная заглушка прототипа не является картой выдачи.
  Рабочий поиск не показывает декоративную карту без функции/API; действующая
  карта расположения остаётся в деталях. Это явно принятое отличие, а не совпадение с эталоном.
- **Состояния API:** дополнительные фильтры, неизвестные tag ID, заинтересованные,
  отсутствие фото/координат, реальные ошибки и loading оформлены средствами UI kit;
  функции не удалялись ради демонстрационного макета.

## Адаптив и высота

- [Плавный проход](redesign-qa/responsive-sweep.json): **216 измерений**, 36 ширин
  между 320 и 1440 px на шести представительных маршрутах, включая границы
  переключения раскладки и объявление с картой. Переполнение documentElement — 0.
- Карточки главной/поиска: 3 колонки на 1440, 2 на 1024/768, 1 на 390/320.
  Профиль использует отдельную композицию Figma; изображения сохраняют пропорции.
- Safe area учитывается CSS env; это браузерная проверка размеров, а не проверка
  физического устройства с вырезом или открытой системной клавиатурой.
  Такой проход и полная доступность остаются в Q02.

## Проверки и данные

- `npm test`: **43 файла, 159 тестов PASS**.
- `npm run lint`: **PASS**, FSD boundaries OK.
- `npm run build`: **PASS**. Существующие предупреждения Sass legacy JS API и
  размера bundle сохраняются; оптимизация вынесена в отдельный план.
- `KEEP_REDESIGN_SMOKE=1 node tests/redesign-live.cjs`: **PASS** на development-БД.
  В том числе auth, фото/профиль, публикация/валидация/теги, избранное,
  два WebSocket-пользователя и reconnect. Это существующий интеграционный сценарий.
- [Production-главная](redesign-qa/production-home-1440.jpg) открыта через Express
  с production-сборкой; новая фотография и медиа API загружаются.
- Созданы два синтетических аккаунта и два собственных объявления: одно live-скриптом,
  второе через браузер с File. После съёмки `redesign-cleanup.cjs` проверил их ID
  и синтетические email, удалил эти аккаунты/объявления и их фото, связи, сообщения.
  Существующие записи, схема БД, env и секреты не менялись. Снимки с временными ID
  остаются доказательством проверки, а не действующими адресами после cleanup.

Сетевая отрисовка Яндекс Карты подтверждена в этой проверке. Качество геокодирования
и гарантии доставки сообщений не входят в визуальную приёмку. Полный проход
клавиатурой, контраст и assistive technologies не заявляются выполненными — это Q02.

## Воспроизведение и хранение

Рабочий клиент: `cd client && npm run dev`, API: `cd server && npm run dev`.
Не сбрасывать существующую БД ради визуальной проверки. Для синтетических данных
использовать live-скрипт выше и завершать его cleanup после браузерной проверки.

Снимки и JSON находятся локально в `docs/redesign-qa/`; по просьбе пользователя
каталог игнорируется Git. При передаче отчёта проверяющему снимки нужно приложить
отдельно. Коммит в этой задаче не создавался. Старые игнорируемые `docs/screenshots` не
используются как доказательство Q01. Каталог содержит только данные этой проверки;
токены, пароли, cookie и локальный smoke-manifest туда не копировались.

## Регрессия после Q03 · 2 ноября 2026

ChakraProvider и старый UI удалены после сверки переноса. Глобальные foundations
переведены из CSS Module в обычный `shared/styles/foundations.scss`: при проверке
выяснилось, что production исключал прежний side-effect module import. В итоговом
CSS теперь присутствуют локальный Inter, CSS-переменные и общий reset; убран
inline-фон `index.html`, перекрывавший токен страницы. Это исправление production-подключения, а не смена визуального эталона.

Повторены production-проверки главной, About, поиска, деталей, входа/регистрации
и NotFound на 320/1440 px; формы/мобильные фильтры/Modal/пагинация — также на 390 px.
Без горизонтального переполнения; один main/h1. Снимки и подробные
результаты — [раздел 27 журнала](redesign-integration-progress.md#27-q03--удаление-старого-ui-2-ноября-2026).
Приёмка физического телефона и настоящего скринридера Q02 остаётся открытой.

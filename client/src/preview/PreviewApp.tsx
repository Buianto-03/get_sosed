/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LuAlertTriangle,
  LuArrowLeft,
  LuBedDouble,
  LuCamera,
  LuCheck,
  LuHeart,
  LuHome,
  LuMessagesSquare,
  LuPlus,
  LuSearch,
  LuUser,
} from 'react-icons/lu';
import {
  longAdvert,
  longMessage,
  noPhotoAdvert,
  postFixture,
  postSteps,
  previewAdverts,
  previewConversations,
  profileFixture,
  type PreviewAdvert,
} from './fixtures';
import { headerRoutes } from '../widgets/header/navigation';
import { SiteLayout } from '../app/layouts/SiteLayout';
import { ListingCard, ListingCardVariant, type ListingCardData } from '../entities/listing/ui/ListingCard';
import { ListingContextCard } from '../entities/listing/ui/ListingContextCard';
import { ListingGallery } from '../entities/listing/ui/ListingGallery';
import { ConversationRow } from '../entities/chat/ui/ConversationRow';
import { PersonSummary, PersonSummaryVariant } from '../entities/person/ui/PersonSummary';
import { Button, ButtonVariant } from '../shared/ui/button/Button';
import { MainBanner } from '../widgets/main-banner/MainBanner';
import { FreshListings } from '../widgets/fresh-listings/FreshListings';
import { HowItWorks } from '../widgets/how-it-works/HowItWorks';
import {
  SearchFilters,
  emptySearchFilters,
  type SearchFilterValues,
} from '../features/advert-filter/ui/SearchFilters';
import { UiFoundationsShowcase } from './UiFoundationsShowcase';

type ScreenId =
  | 'home'
  | 'search'
  | 'detail'
  | 'about'
  | 'signin'
  | 'signup'
  | 'profile'
  | 'chat'
  | 'post';

type VariantId =
  | 'data'
  | 'long'
  | 'empty'
  | 'error'
  | 'no-photo'
  | 'one-photo'
  | 'two-photos'
  | 'many-photos'
  | 'loading'
  | 'filled'
  | 'conversation'
  | 'no-selection'
  | 'step-1'
  | 'step-2'
  | 'step-3'
  | 'step-4';

type ViewportId = 'desktop' | 'tablet' | 'mobile';
type HeaderMode = 'guest' | 'user';

const screens: { id: ScreenId; label: string }[] = [
  { id: 'home', label: 'Главная' },
  { id: 'search', label: 'Поиск' },
  { id: 'detail', label: 'Объявление' },
  { id: 'about', label: 'О сервисе' },
  { id: 'signin', label: 'Вход' },
  { id: 'signup', label: 'Регистрация' },
  { id: 'profile', label: 'Профиль' },
  { id: 'chat', label: 'Чат' },
  { id: 'post', label: 'Публикация' },
];

const variants: Record<ScreenId, { id: VariantId; label: string }[]> = {
  home: [
    { id: 'data', label: 'С данными' },
    { id: 'long', label: 'Длинный заголовок' },
    { id: 'no-photo', label: 'Карточка без фото' },
    { id: 'empty', label: 'Пустая подборка' },
  ],
  search: [
    { id: 'data', label: 'С данными' },
    { id: 'empty', label: 'Пусто' },
    { id: 'error', label: 'Ошибка' },
  ],
  detail: [
    { id: 'data', label: 'С данными' },
    { id: 'long', label: 'Длинное описание' },
    { id: 'no-photo', label: 'Без фото' },
    { id: 'one-photo', label: 'Одно фото' },
    { id: 'two-photos', label: 'Два фото' },
    { id: 'many-photos', label: 'Много фото' },
  ],
  about: [
    { id: 'data', label: 'Обычный текст' },
    { id: 'long', label: 'Длинный текст' },
  ],
  signin: [
    { id: 'data', label: 'Обычное состояние' },
    { id: 'error', label: 'Ошибка формы' },
    { id: 'loading', label: 'Отправка' },
  ],
  signup: [
    { id: 'data', label: 'Обычное состояние' },
    { id: 'error', label: 'Ошибка поля' },
  ],
  profile: [
    { id: 'filled', label: 'Заполнен' },
    { id: 'empty', label: 'Пустые списки' },
    { id: 'long', label: 'Длинный текст' },
  ],
  chat: [
    { id: 'conversation', label: 'Переписка' },
    { id: 'empty', label: 'Нет диалогов' },
    { id: 'no-selection', label: 'Нет выбранного диалога' },
    { id: 'long', label: 'Длинное сообщение' },
  ],
  post: [
    { id: 'step-1', label: 'Шаг 1 · Комната' },
    { id: 'step-2', label: 'Шаг 2 · Цена и правила' },
    { id: 'step-3', label: 'Шаг 3 · Фотографии' },
    { id: 'step-4', label: 'Шаг 4 · Публикация' },
    { id: 'long', label: 'Длинные значения' },
  ],
};

const viewportWidths: Record<ViewportId, number> = {
  desktop: 1440,
  tablet: 1024,
  mobile: 390,
};

const viewportIds: ViewportId[] = ['desktop', 'tablet', 'mobile'];

const viewportLabels: Record<ViewportId, string> = {
  desktop: 'Desktop · 1440',
  tablet: 'Планшет · 1024',
  mobile: 'Телефон · 390',
};

function getInitialValue<T extends string>(
  parameter: string,
  choices: readonly T[],
  fallback: T,
): T {
  const value = new URLSearchParams(window.location.search).get(parameter);
  return choices.includes(value as T) ? (value as T) : fallback;
}

function PreviewApp(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const screen = (Object.keys(headerRoutes) as ScreenId[])
    .find((page) => headerRoutes[page] === location.pathname) ?? 'home';
  const [variant, setVariant] = useState<VariantId>(() => {
    const initialScreen = getInitialValue('screen', screens.map(({ id }) => id), 'home');
    const initialVariants = variants[initialScreen].map(({ id }) => id);
    return getInitialValue('variant', initialVariants, initialVariants[0]);
  });
  const [viewport, setViewport] = useState<ViewportId>(
    () => getInitialValue('width', viewportIds, 'desktop'),
  );
  const [headerMode, setHeaderMode] = useState<HeaderMode>(
    () => getInitialValue('header', ['guest', 'user'], 'guest'),
  );
  const previousScreen = useRef(screen);
  const activeVariants = variants[screen];

  useEffect(() => {
    if (previousScreen.current !== screen) {
      previousScreen.current = screen;
      setVariant(variants[screen][0].id);
    }
  }, [screen]);

  useEffect(() => {
    if (headerMode === 'guest' && ['chat', 'post', 'profile'].includes(screen)) {
      navigate(headerRoutes.signin, { replace: true });
    }
  }, [headerMode, navigate, screen]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('screen', screen);
    params.set('width', viewport);
    params.set('variant', variant);
    params.set('header', headerMode);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [screen, variant, viewport, headerMode]);

  const selectScreen = (nextScreen: ScreenId): void => {
    navigate(headerRoutes[nextScreen]);
    setVariant(variants[nextScreen][0].id);
  };

  const isVariantValid = activeVariants.some(({ id }) => id === variant);
  const activeVariant = isVariantValid ? variant : activeVariants[0].id;

  return (
    <main className="preview-app">
      <div className="preview-toolbar">
        <div className="preview-toolbar-heading">
          <div>
            <span className="preview-eyebrow">GETSOSED · WARM NEUTRAL</span>
            <h1>Превью экранов</h1>
          </div>
          <p>Локальные демонстрационные данные · без API и авторизации</p>
        </div>
        <div className="preview-controls">
          <div className="preview-control">
            <label htmlFor="preview-screen">Экран</label>
            <select
              id="preview-screen"
              aria-label="Экран превью"
              value={screen}
              onChange={(event) => selectScreen(event.target.value as ScreenId)}
            >
              {screens.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="preview-control">
            <label htmlFor="preview-state">Состояние</label>
            <select
              id="preview-state"
              aria-label="Состояние превью"
              value={activeVariant}
              onChange={(event) => setVariant(event.target.value as VariantId)}
            >
              {activeVariants.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="preview-control">
            <label htmlFor="preview-width">Ширина</label>
            <select
              id="preview-width"
              aria-label="Ширина превью"
              value={viewport}
              onChange={(event) => setViewport(event.target.value as ViewportId)}
            >
              {viewportIds.map((id) => (
                <option key={id} value={id}>
                  {viewportLabels[id]}
                </option>
              ))}
            </select>
          </div>
          <div className="preview-control">
            <label htmlFor="preview-header">Шапка</label>
            <select
              id="preview-header"
              value={headerMode}
              onChange={(event) => setHeaderMode(event.target.value as HeaderMode)}
            >
              <option value="guest">Гость</option>
              <option value="user">Пользователь</option>
            </select>
          </div>
        </div>
      </div>

      <div className="preview-frame-wrap">
        <div
          id="preview-frame"
          className="preview-frame"
          style={{ '--preview-width': `${viewportWidths[viewport]}px` } as React.CSSProperties}
          data-viewport={viewport}
        >
          <SiteLayout
            fullscreenChat={screen === 'chat'}
            bottomNavigation={<MobileNavigation screen={screen} onNavigate={selectScreen} />}
            user={headerMode === 'user' ? { name: profileFixture.name } : undefined}
            onSignOut={() => {
              setHeaderMode('guest');
              selectScreen('home');
            }}
          >
            <ScreenContent screen={screen} variant={activeVariant} onNavigate={selectScreen} />
          </SiteLayout>
        </div>
      </div>
      <p className="preview-footnote">
        Состояние можно сохранить ссылкой: экран, ширина, вариант и вид шапки указаны в параметрах адреса.
      </p>
      <UiFoundationsShowcase />
    </main>
  );
}

function MobileNavigation({
  screen,
  onNavigate,
}: {
  screen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}): JSX.Element {
  const items: { id: ScreenId; label: string; icon: JSX.Element }[] = [
    { id: 'home', label: 'Главная', icon: <LuHome aria-hidden="true" /> },
    { id: 'search', label: 'Поиск', icon: <LuSearch aria-hidden="true" /> },
    { id: 'post', label: 'Подать', icon: <LuPlus aria-hidden="true" /> },
    { id: 'chat', label: 'Чаты', icon: <LuMessagesSquare aria-hidden="true" /> },
    { id: 'profile', label: 'Профиль', icon: <LuUser aria-hidden="true" /> },
  ];

  return (
    <nav className="preview-mobile-nav" aria-label="Мобильная навигация">
      {items.map((item) => (
        <button
          key={item.id}
          className={screen === item.id ? 'is-active' : ''}
          type="button"
          aria-current={screen === item.id ? 'page' : undefined}
          onClick={() => onNavigate(item.id)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

function ScreenContent({
  screen,
  variant,
  onNavigate,
}: {
  screen: ScreenId;
  variant: VariantId;
  onNavigate: (screen: ScreenId) => void;
}): JSX.Element {
  switch (screen) {
    case 'home':
      return <HomeScreen variant={variant} onNavigate={onNavigate} />;
    case 'search':
      return <SearchScreen variant={variant} onNavigate={onNavigate} />;
    case 'detail':
      return <DetailScreen variant={variant} onNavigate={onNavigate} />;
    case 'about':
      return <AboutScreen variant={variant} onNavigate={onNavigate} />;
    case 'signin':
      return <AuthScreen mode="signin" variant={variant} onNavigate={onNavigate} />;
    case 'signup':
      return <AuthScreen mode="signup" variant={variant} onNavigate={onNavigate} />;
    case 'profile':
      return <ProfileScreen variant={variant} onNavigate={onNavigate} />;
    case 'chat':
      return <ChatScreen variant={variant} />;
    case 'post':
      return <PostScreen variant={variant} />;
    default:
      return <HomeScreen variant="data" onNavigate={onNavigate} />;
  }
}

function HomeScreen({
  variant,
  onNavigate,
}: {
  variant: VariantId;
  onNavigate: (screen: ScreenId) => void;
}): JSX.Element {
  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);
  let adverts = previewAdverts;
  if (variant === 'empty') adverts = [];
  if (variant === 'long') adverts = [longAdvert, ...previewAdverts.slice(1)];
  if (variant === 'no-photo') adverts = [noPhotoAdvert, ...previewAdverts.slice(1)];
  const listings = adverts.map((advert) => ({
    id: advert.id,
    listing: {
      title: advert.title,
      price: advert.price,
      imageUrl: advert.image || undefined,
      imageAlt: advert.imageAlt || undefined,
      city: advert.city,
      district: advert.district,
      metro: advert.metro,
      tags: advert.tags,
    } satisfies ListingCardData,
    saved: savedListingIds.includes(advert.id),
  }));
  return (
    <main className="preview-page preview-home-page">
      <MainBanner
        onFindHousing={() => onNavigate('search')}
        onCreateListing={() => onNavigate('post')}
        description={variant === 'long' ? longAdvert.description : undefined}
      />
      <FreshListings
        listings={listings}
        onOpenListing={() => onNavigate('detail')}
        onSaveListing={(id, saved) => {
          setSavedListingIds((current) => (
            saved ? [...new Set([...current, id])] : current.filter((savedId) => savedId !== id)
          ));
        }}
        onViewAllListings={() => onNavigate('search')}
      />
      <HowItWorks />
    </main>
  );
}

function SearchScreen({
  variant,
  onNavigate,
}: {
  variant: VariantId;
  onNavigate: (screen: ScreenId) => void;
}): JSX.Element {
  const [appliedFilters, setAppliedFilters] = useState<SearchFilterValues>(emptySearchFilters);
  const filteredAdverts = previewAdverts.filter((advert) => {
    const includes = (value: string, query: string): boolean => (
      value.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru'))
    );
    return (
      (!appliedFilters.city || advert.city === appliedFilters.city)
      && (!appliedFilters.priceTo || advert.price <= Number(appliedFilters.priceTo))
      && (!appliedFilters.roomsFrom || advert.rooms >= Number(appliedFilters.roomsFrom))
      && includes(advert.district, appliedFilters.district)
      && includes(advert.metro, appliedFilters.metro)
      && appliedFilters.conditions.every((condition) => advert.tags.includes(condition))
    );
  });
  const resultTotal = variant === 'empty' ? 0 : filteredAdverts.length;
  let resultNoun = 'вариантов';
  if (resultTotal === 1) resultNoun = 'вариант';
  if (resultTotal >= 2 && resultTotal <= 4) resultNoun = 'варианта';
  let resultCount = `${resultTotal} ${resultNoun}`;
  if (variant === 'error') resultCount = 'Ошибка загрузки';

  let resultsContent: JSX.Element;
  if (variant === 'empty' || (variant !== 'error' && filteredAdverts.length === 0)) {
    resultsContent = (
      <EmptyPanel
        title="Пока ничего не найдено"
        text="Измените фильтры или попробуйте другой район."
        action="Сбросить фильтры"
        onAction={() => setAppliedFilters(emptySearchFilters)}
      />
    );
  } else if (variant === 'error') {
    resultsContent = (
      <StatePanel
        icon={<LuAlertTriangle aria-hidden="true" />}
        title="Не удалось загрузить объявления"
        text="Проверьте соединение и попробуйте снова."
        action="Повторить"
        tone="error"
      />
    );
  } else {
    resultsContent = (
      <>
        <ListingGrid adverts={filteredAdverts} variant={ListingCardVariant.Search} onOpen={() => onNavigate('detail')} />
        <div className="preview-map-placeholder">Объявления на карте</div>
      </>
    );
  }

  return (
    <main className="preview-page">
      <div className="preview-page-heading">
        <h2>Найти жильё</h2>
        <p>Выбирайте варианты по цене, месту и условиям.</p>
      </div>
      <SearchFilters
        applied={appliedFilters}
        onApply={setAppliedFilters}
        getDrawerBoundary={() => document.getElementById('preview-frame')}
      />
      <section className="preview-section preview-results">
        <div className="preview-section-heading">
          <h2>Объявления</h2>
          <span className="preview-result-count">{resultCount}</span>
        </div>
        {resultsContent}
      </section>
    </main>
  );
}

function DetailScreen({
  variant,
  onNavigate,
}: {
  variant: VariantId;
  onNavigate: (screen: ScreenId) => void;
}): JSX.Element {
  const advert = variant === 'long' ? longAdvert : previewAdverts[0];
  let photoSources = [advert.image, '/images/1pic.jpg', '/mainPhoto.jpg'];
  if (variant === 'no-photo') photoSources = [];
  if (variant === 'one-photo') photoSources = [advert.image];
  if (variant === 'two-photos') photoSources = [advert.image, '/images/1pic.jpg'];
  if (variant === 'many-photos') {
    photoSources = [
      advert.image,
      '/images/1pic.jpg',
      '/mainPhoto.jpg',
      '/images/kvartira-moskva-bratskaya-ulica-2249903312-1.jpg',
    ];
  }
  const photos = photoSources.map((src, index) => ({
    id: `${advert.id}-photo-${index}`,
    src,
    alt: index === 0 ? advert.imageAlt : 'Фото квартиры',
  }));
  return (
    <main className="preview-page">
      <button className="preview-text-button preview-back-button" type="button" onClick={() => onNavigate('search')}>
        <LuArrowLeft aria-hidden="true" /> К результатам
      </button>
      <h2 className="preview-detail-title">{advert.title}</h2>
      <ListingGallery photos={photos} />
      <div className="preview-detail-grid">
        <div className="preview-detail-content">
          <section className="preview-panel">
            <h3>О жилье</h3>
            <div className="preview-facts">
              <span><LuBedDouble aria-hidden="true" /> {advert.rooms} комнаты</span>
              <span>Площадь объекта {advert.area} м²</span>
              <span>{advert.floor} этаж</span>
            </div>
            <p>{advert.description}</p>
            <TagList tags={advert.tags} />
          </section>
          <section className="preview-panel">
            <h3>Расположение</h3>
            <p>{advert.city}, {advert.district} · {advert.metro}</p>
            <div className="preview-map-placeholder">Карта</div>
          </section>
          <section className="preview-panel">
            <h3>Заинтересованные пользователи</h3>
            <p>Здесь отображаются пользователи, которым интересно это объявление.</p>
          </section>
        </div>
        <aside className="preview-contact-card">
          <strong className="preview-price">{advert.price.toLocaleString('ru-RU')} ₽</strong>
          <p>Период и предмет аренды уточняются у автора</p>
          <div className="preview-author"><PersonSummary name={advert.author} city={advert.city} /></div>
          <button className="preview-button preview-button-primary preview-wide-button" type="button" onClick={() => onNavigate('signin')}>
            Написать автору
          </button>
          <button className="preview-button preview-button-secondary preview-wide-button" type="button">
            <LuHeart aria-hidden="true" /> В избранное
          </button>
          <p className="preview-muted">Залог, коммунальные, комиссия, дата заселения и время до метро не указаны.</p>
        </aside>
      </div>
    </main>
  );
}

function AboutScreen({
  variant,
  onNavigate,
}: {
  variant: VariantId;
  onNavigate: (screen: ScreenId) => void;
}): JSX.Element {
  const description = variant === 'long'
    ? longAdvert.description
    : 'Помогаем найти жильё для совместного проживания и познакомиться с будущими соседями.';
  return (
    <main className="preview-page">
      <section className="preview-banner preview-about-banner">
        <div className="preview-banner-copy">
          <p className="preview-kicker">О сервисе</p>
          <h2>Комфортный дом начинается с людей</h2>
          <p>{description}</p>
          <button className="preview-button preview-button-primary" type="button" onClick={() => onNavigate('search')}>
            Смотреть объявления
          </button>
        </div>
        <img src="/mainPhoto.jpg" alt="Интерьер квартиры" />
      </section>
      <section className="preview-section preview-step-grid">
        <StepCard number="01" title="Ищите подходящее" text="Выберите район, бюджет и условия проживания." />
        <StepCard number="02" title="Смотрите детали" text="Изучите фото, описание и расположение жилья." />
        <StepCard number="03" title="Общайтесь" text="Свяжитесь с автором и обсудите совместную аренду." />
      </section>
    </main>
  );
}

function AuthScreen({
  mode,
  variant,
  onNavigate,
}: {
  mode: 'signin' | 'signup';
  variant: VariantId;
  onNavigate: (screen: ScreenId) => void;
}): JSX.Element {
  const isSignup = mode === 'signup';
  const isError = variant === 'error';
  const isLoading = variant === 'loading';
  let submitLabel = isSignup ? 'Зарегистрироваться' : 'Войти';
  if (isLoading) submitLabel = 'Входим…';
  const fields = isSignup
    ? ['Имя', 'Email', 'Пароль', 'Повторите пароль']
    : ['Email', 'Пароль'];

  return (
    <main className="preview-page preview-auth-page">
      <form className="preview-auth-card" onSubmit={(event) => event.preventDefault()}>
        <h2>{isSignup ? 'Регистрация' : 'Войти'}</h2>
        <p>{isSignup ? 'Создайте профиль, чтобы общаться и размещать объявления.' : 'Войдите, чтобы писать авторам и сохранять объявления.'}</p>
        {fields.map((field, index) => (
          <FieldMock
            key={field}
            label={field}
            value={isError && index === 0 ? 'Неверный формат' : ''}
            error={isError && index === 0}
            type={field.toLowerCase().includes('пароль') ? 'password' : 'text'}
          />
        ))}
        {isError && <p className="preview-field-error">{isSignup ? 'Проверьте это поле.' : 'Не удалось выполнить вход. Проверьте данные.'}</p>}
        <button className="preview-button preview-button-primary preview-wide-button" type="submit" disabled={isLoading}>
          {submitLabel}
        </button>
        <button className="preview-text-button" type="button" onClick={() => onNavigate(isSignup ? 'signin' : 'signup')}>
          {isSignup ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </button>
        <button className="preview-text-button" type="button" onClick={() => onNavigate('home')}>
          Смотреть объявления без входа
        </button>
      </form>
    </main>
  );
}

function ProfileScreen({
  variant,
  onNavigate,
}: {
  variant: VariantId;
  onNavigate: (screen: ScreenId) => void;
}): JSX.Element {
  const isEmpty = variant === 'empty';
  const isLong = variant === 'long';
  const { favorites: savedAdverts } = profileFixture;
  let favorites = savedAdverts;
  if (isEmpty) favorites = [];
  if (isLong) favorites = [longAdvert, ...profileFixture.favorites];
  const myAdverts = isEmpty ? [] : profileFixture.myAdverts;

  return (
    <main className="preview-page">
      <div className="preview-page-heading preview-heading-with-action">
        <h2>Профиль</h2>
        <button className="preview-button preview-button-primary" type="button" onClick={() => onNavigate('post')}>
          <LuPlus aria-hidden="true" /> Разместить объявление
        </button>
      </div>
      <PersonSummary
        name={profileFixture.name}
        city={`${profileFixture.city} · Ищу жильё для совместной аренды`}
        description={isLong ? longAdvert.description : profileFixture.about}
        tags={profileFixture.tags}
        variant={PersonSummaryVariant.Profile}
        action={<Button variant={ButtonVariant.Secondary}>Изменить профиль</Button>}
      />
      <section className="preview-section">
        <h2>Избранное</h2>
        {favorites.length ? <ListingGrid adverts={favorites} variant={ListingCardVariant.Profile} initiallySaved onOpen={() => onNavigate('detail')} /> : <EmptyPanel title="Пока нет сохранённых объявлений" />}
      </section>
      <section className="preview-section">
        <h2>Мои объявления</h2>
        {myAdverts.length ? <ListingGrid adverts={myAdverts} variant={ListingCardVariant.Profile} onOpen={() => onNavigate('detail')} /> : <EmptyPanel title="Здесь будут ваши объявления" action="Разместить объявление" />}
      </section>
    </main>
  );
}

function ChatScreen({ variant }: { variant: VariantId }): JSX.Element {
  const isEmpty = variant === 'empty';
  const noSelection = variant === 'no-selection';
  const activeConversation = previewConversations[0];

  return (
    <main className="preview-page preview-chat-page">
      <div className="preview-page-heading"><h2>Сообщения</h2></div>
      <div className="preview-chat-grid">
        <section className="preview-panel preview-chat-list">
          <h3>Диалоги</h3>
          {isEmpty ? (
            <EmptyPanel title="Пока нет сообщений" />
          ) : (
            previewConversations.map((item, index) => (
              <ConversationRow
                key={item.id}
                name={item.name}
                listingTitle={item.advert}
                lastMessage={item.lastMessage}
                time={item.time}
                active={index === 0}
              />
            ))
          )}
        </section>
        <section className="preview-panel preview-chat-thread">
          {noSelection && (
            <EmptyPanel title="Выберите диалог" text="Здесь появится переписка с автором объявления." />
          )}
          {!noSelection && isEmpty && <EmptyPanel title="Нет выбранного диалога" />}
          {!noSelection && !isEmpty && (
            <>
              <header className="preview-thread-header">
                <strong>{activeConversation.name}</strong>
              </header>
              <ListingContextCard
                title={activeConversation.advert}
                price={previewAdverts[0].price}
                imageUrl={previewAdverts[0].image}
                onOpen={() => undefined}
              />
              <div className="preview-message-list">
                {activeConversation.messages.map((message) => (
                  <p className={message.from === 'me' ? 'preview-message is-mine' : 'preview-message'} key={message.id}>
                    {variant === 'long' && message.from === 'me' ? longMessage : message.text}
                  </p>
                ))}
              </div>
              <div className="preview-quick-replies">
                <button type="button">Здравствуйте!</button>
                <button type="button">Когда можно посмотреть?</button>
              </div>
              <form className="preview-chat-composer" onSubmit={(event) => event.preventDefault()}>
                <input aria-label="Сообщение" placeholder="Напишите сообщение" />
                <button className="preview-button preview-button-primary" type="submit">Отправить</button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function PostScreen({ variant }: { variant: VariantId }): JSX.Element {
  const stepNumber = variant.startsWith('step-') ? Number(variant.slice(-1)) : 1;
  const selectedStep = variant === 'long' ? 1 : stepNumber;
  const fieldValue = variant === 'long' ? longAdvert.title : postFixture.title;

  return (
    <main className="preview-page">
      <div className="preview-page-heading">
        <h2>Найдём тебе соседа</h2>
        <p>Шаг {selectedStep} из 4</p>
      </div>
      <nav className="preview-stepper" aria-label="Шаги публикации">
        {postSteps.map((step) => {
          let className = '';
          if (step.id === selectedStep) className = 'is-active';
          if (step.id < selectedStep) className = 'is-complete';
          return (
            <div className={className} key={step.id}>
              <span>{step.id < selectedStep ? <LuCheck aria-hidden="true" /> : step.id}</span>
              <small>{step.title}</small>
            </div>
          );
        })}
      </nav>
      <section className="preview-panel preview-post-form">
        {selectedStep === 1 && (
          <>
            <h3>Расскажите о комнате</h3>
            <FieldMock label="Название объявления" value={fieldValue} />
            <div className="preview-form-grid">
              <FieldMock label="Город" value={postFixture.city} />
              <FieldMock label="Район и метро" value={`${postFixture.district} · ${postFixture.metro}`} />
            </div>
            <FieldMock label="Площадь комнаты, м²" value={postFixture.area} />
          </>
        )}
        {selectedStep === 2 && (
          <>
            <h3>Цена и правила</h3>
            <FieldMock label="Стоимость" value={postFixture.price} />
            <FieldMock label="Описание" value={variant === 'long' ? longAdvert.description : postFixture.description} multiline />
            <TagList tags={['Для некурящих', 'Тихие вечера', 'С рабочим местом']} />
          </>
        )}
        {selectedStep === 3 && (
          <>
            <h3>Добавьте фотографии</h3>
            <div className="preview-upload-grid">
              {previewAdverts.slice(0, 2).map((advert) => <img src={advert.image} alt={advert.imageAlt} key={advert.id} />)}
              <div className="preview-upload-placeholder"><LuCamera aria-hidden="true" /> Добавить фото</div>
            </div>
          </>
        )}
        {selectedStep === 4 && (
          <>
            <h3>Проверьте объявление</h3>
            <PreviewListingCard advert={previewAdverts[0]} variant={ListingCardVariant.Profile} onOpen={() => undefined} />
            <p>Публикация в этом превью не отправляет данные.</p>
          </>
        )}
        <div className="preview-form-actions">
          <button className="preview-button preview-button-secondary" type="button" disabled={selectedStep === 1}>Назад</button>
          <button className="preview-button preview-button-primary" type="button">{selectedStep === 4 ? 'Опубликовать' : 'Продолжить'}</button>
        </div>
      </section>
    </main>
  );
}

function ListingGrid({
  adverts,
  variant,
  initiallySaved = false,
  onOpen,
}: {
  adverts: PreviewAdvert[];
  variant: ListingCardVariant;
  initiallySaved?: boolean;
  onOpen: (advert: PreviewAdvert) => void;
}): JSX.Element {
  return (
    <div className="preview-listing-grid">
      {adverts.map((advert) => (
        <PreviewListingCard
          advert={advert}
          key={advert.id}
          variant={variant}
          initiallySaved={initiallySaved}
          onOpen={() => onOpen(advert)}
        />
      ))}
    </div>
  );
}

function PreviewListingCard({
  advert,
  variant,
  initiallySaved = false,
  onOpen,
}: {
  advert: PreviewAdvert;
  variant: ListingCardVariant;
  initiallySaved?: boolean;
  onOpen: () => void;
}): JSX.Element {
  const [saved, setSaved] = useState(initiallySaved);
  return (
    <ListingCard
      listing={{
        title: advert.title,
        price: advert.price,
        imageUrl: advert.image || undefined,
        imageAlt: advert.imageAlt || undefined,
        city: advert.city,
        district: advert.district,
        metro: advert.metro,
        tags: advert.tags,
      }}
      variant={variant}
      saved={saved}
      onSavedChange={setSaved}
      onOpen={onOpen}
    />
  );
}

function FieldMock({
  label,
  value,
  type = 'text',
  error = false,
  multiline = false,
}: {
  label: string;
  value?: string;
  type?: string;
  error?: boolean;
  multiline?: boolean;
}): JSX.Element {
  const fieldId = useId();
  return (
    <div className={error ? 'preview-field has-error' : 'preview-field'}>
      <label htmlFor={fieldId}>{label}</label>
      {multiline ? (
        <textarea id={fieldId} readOnly value={value ?? ''} rows={4} />
      ) : (
        <input id={fieldId} readOnly type={type} value={value ?? ''} placeholder={label} />
      )}
      {error && <small id={`${fieldId}-error`}>Проверьте значение.</small>}
    </div>
  );
}

function TagList({ tags }: { tags: string[] }): JSX.Element {
  return (
    <div className="preview-tag-list">
      {tags.map((tag) => <span key={tag}>{tag}</span>)}
    </div>
  );
}

function StepCard({ number, title, text }: { number: string; title: string; text: string }): JSX.Element {
  return (
    <article className="preview-step-card">
      <span>{number}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function EmptyPanel({
  title = 'Пока ничего не найдено',
  text = 'Измените фильтры или попробуйте другой район.',
  action,
  onAction,
}: {
  title?: string;
  text?: string;
  action?: string;
  onAction?: () => void;
}): JSX.Element {
  return (
    <div className="preview-state-panel">
      <div className="preview-state-icon"><LuSearch aria-hidden="true" /></div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && <button className="preview-button preview-button-secondary" type="button" onClick={onAction}>{action}</button>}
    </div>
  );
}

function StatePanel({
  icon,
  title,
  text,
  action,
  tone,
}: {
  icon: JSX.Element;
  title: string;
  text: string;
  action: string;
  tone: 'error';
}): JSX.Element {
  return (
    <div className={`preview-state-panel is-${tone}`}>
      <div className="preview-state-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="preview-button preview-button-secondary" type="button">{action}</button>
    </div>
  );
}

export default PreviewApp;

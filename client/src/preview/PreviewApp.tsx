/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LuHome,
  LuMessagesSquare,
  LuPlus,
  LuSearch,
  LuUser,
} from 'react-icons/lu';
import { ListingDetails } from '@widgets/listing-details/listing-details/ListingDetails';
import { AboutBanner } from '@widgets/about-banner/AboutBanner';
import { AboutSteps } from '@widgets/about-steps/AboutSteps';
import { SignInCard, type SignInFeedback } from '@features/sign-in/ui/sign-in-card/SignInCard';
import { SignUpCard, type SignUpFeedback, type SignUpValues } from '@features/sign-up/ui/sign-up-card/SignUpCard';
import { ProfileEditForm } from '@features/edit-profile/ui/profile-edit-form/ProfileEditForm';
import { ProfilePage, type ProfileDetails } from '@pages/profile/ui/profile-page/ProfilePage';
import { AlertVariant } from '@shared/ui/feedback/Alert';
import { ChatPage, type ChatMessage } from '@pages/chat/ui/chat-page/ChatPage';
import { ListingCreatePublishState } from '@features/listing-create/model';
import { ListingCreatePage } from '@pages/listing-create/ui/listing-create-page/ListingCreatePage';
import {
  longAdvert,
  longMessage,
  noPhotoAdvert,
  postFixture,
  previewAdverts,
  previewConversations,
  profileFixture,
} from './fixtures';
import { previewRoutes, type PreviewScreen } from './routes';
import { SiteLayout } from '../app/layouts/SiteLayout';
import { type ListingCardData } from '../entities/listing/ui/listing-card/ListingCard';
import { MainBanner } from '../widgets/main-banner/MainBanner';
import { FreshListings } from '../widgets/fresh-listings/FreshListings';
import { HowItWorks } from '../widgets/how-it-works/HowItWorks';
import { ListingHeader } from '../widgets/listing-header/ListingHeader';
import { SearchResults, SearchResultsState } from '../widgets/search-results/SearchResults';
import {
  SearchFilters,
  emptySearchFilters,
  type SearchFilterValues,
} from '../features/advert-filter/ui/SearchFilters';
import { UiFoundationsShowcase } from './UiFoundationsShowcase';
import { toProfileListings } from './helper';
import { previewTagCatalog } from './tag-catalog';

type ScreenId = PreviewScreen;

type VariantId =
  | 'data'
  | 'long'
  | 'empty'
  | 'error'
  | 'no-photo'
  | 'one-photo'
  | 'two-photos'
  | 'many-photos'
  | 'disabled-contact'
  | 'disabled'
  | 'loading'
  | 'partial'
  | 'filled'
  | 'conversation'
  | 'no-selection'
  | 'step-1'
  | 'step-2'
  | 'step-3'
  | 'step-4'
  | 'step-1-error'
  | 'step-2-error'
  | 'publish-loading'
  | 'publish-error'
  | 'published'
  | 'empty-profile'
  | 'empty-favorites'
  | 'empty-listings'
  | 'avatar-fallback'
  | 'editing'
  | 'send-error';

type ViewportId = 'desktop' | 'tablet' | 'tablet-small' | 'mobile' | 'mobile-small';
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
    { id: 'long', label: 'Длинный заголовок' },
    { id: 'loading', label: 'Загрузка' },
    { id: 'partial', label: 'Промежуточное количество' },
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
    { id: 'disabled-contact', label: 'Недоступное действие' },
  ],
  about: [
    { id: 'data', label: 'Обычный текст' },
    { id: 'long', label: 'Длинный текст' },
  ],
  signin: [
    { id: 'data', label: 'Обычное состояние' },
    { id: 'error', label: 'Ошибка формы' },
    { id: 'loading', label: 'Отправка' },
    { id: 'disabled', label: 'Недоступная форма' },
  ],
  signup: [
    { id: 'data', label: 'Обычное состояние' },
    { id: 'error', label: 'Ошибка поля' },
    { id: 'loading', label: 'Отправка' },
  ],
  profile: [
    { id: 'filled', label: 'Заполнен' },
    { id: 'empty-profile', label: 'Пустой профиль' },
    { id: 'empty-favorites', label: 'Нет избранного' },
    { id: 'empty-listings', label: 'Нет своих объявлений' },
    { id: 'empty', label: 'Пустые списки' },
    { id: 'long', label: 'Длинное имя и текст' },
    { id: 'avatar-fallback', label: 'Аватар: запасные инициалы' },
    { id: 'editing', label: 'Редактирование' },
  ],
  chat: [
    { id: 'conversation', label: 'Переписка' },
    { id: 'empty', label: 'Нет диалогов' },
    { id: 'no-selection', label: 'Нет выбранного диалога' },
    { id: 'long', label: 'Длинное сообщение' },
    { id: 'send-error', label: 'Ошибка отправки' },
  ],
  post: [
    { id: 'step-1', label: 'Шаг 1 · Комната' },
    { id: 'step-2', label: 'Шаг 2 · Цена и правила' },
    { id: 'step-3', label: 'Шаг 3 · Фотографии' },
    { id: 'step-4', label: 'Шаг 4 · Публикация' },
    { id: 'long', label: 'Длинные значения' },
    { id: 'step-1-error', label: 'Ошибки · Комната' },
    { id: 'step-2-error', label: 'Ошибки · Цена и правила' },
    { id: 'publish-loading', label: 'Публикация · загрузка' },
    { id: 'publish-error', label: 'Публикация · ошибка' },
    { id: 'published', label: 'Публикация · успех' },
  ],
};

const viewportWidths: Record<ViewportId, number> = {
  desktop: 1440,
  tablet: 1024,
  'tablet-small': 768,
  mobile: 390,
  'mobile-small': 320,
};

const viewportIds: ViewportId[] = ['desktop', 'tablet', 'tablet-small', 'mobile', 'mobile-small'];

const viewportLabels: Record<ViewportId, string> = {
  desktop: 'Desktop · 1440',
  tablet: 'Планшет · 1024',
  'tablet-small': 'Планшет · 768',
  mobile: 'Телефон · 390',
  'mobile-small': 'Телефон · 320',
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
  const screen = (Object.keys(previewRoutes) as ScreenId[])
    .find((page) => previewRoutes[page] === location.pathname) ?? 'home';
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
  const [profile, setProfile] = useState<ProfileDetails>({
    name: profileFixture.name,
    city: profileFixture.city,
    intent: 'Ищу жильё для совместной аренды',
    description: profileFixture.about,
    habits: profileFixture.tags,
  });
  const profileAvatarUrl = useRef<string>();
  const previousScreen = useRef(screen);
  const activeVariants = variants[screen];

  useEffect(() => () => {
    if (profileAvatarUrl.current) URL.revokeObjectURL(profileAvatarUrl.current);
  }, []);

  const applyProfile = (nextProfile: ProfileDetails, avatarFile: File | null | undefined): void => {
    let { avatarUrl } = nextProfile;
    if (avatarFile instanceof File) avatarUrl = URL.createObjectURL(avatarFile);
    if (avatarFile === null) avatarUrl = undefined;
    if (profileAvatarUrl.current && profileAvatarUrl.current !== avatarUrl) {
      URL.revokeObjectURL(profileAvatarUrl.current);
    }
    profileAvatarUrl.current = avatarUrl?.startsWith('blob:') ? avatarUrl : undefined;
    setProfile({ ...nextProfile, avatarUrl });
  };

  useEffect(() => {
    if (previousScreen.current !== screen) {
      previousScreen.current = screen;
      setVariant(variants[screen][0].id);
    }
  }, [screen]);

  useEffect(() => {
    if (headerMode === 'guest' && ['chat', 'post', 'profile'].includes(screen)) {
      navigate(previewRoutes.signin, { replace: true });
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
    navigate(previewRoutes[nextScreen]);
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
            user={headerMode === 'user' ? { name: profile.name } : undefined}
            onSignOut={() => {
              setHeaderMode('guest');
              selectScreen('home');
            }}
          >
            <ScreenContent
              screen={screen}
              variant={activeVariant}
              onNavigate={selectScreen}
              onSelectVariant={setVariant}
              profile={profile}
              onApplyProfile={applyProfile}
            />
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
  onSelectVariant,
  profile,
  onApplyProfile,
}: {
  screen: ScreenId;
  variant: VariantId;
  onNavigate: (screen: ScreenId) => void;
  onSelectVariant: (variant: VariantId) => void;
  profile: ProfileDetails;
  onApplyProfile: (profile: ProfileDetails, avatarFile: File | null | undefined) => void;
}): JSX.Element {
  switch (screen) {
    case 'home':
      return <HomeScreen variant={variant} onNavigate={onNavigate} />;
    case 'search':
      return <SearchScreen variant={variant} onNavigate={onNavigate} onSelectVariant={onSelectVariant} />;
    case 'detail':
      return <DetailScreen variant={variant} onNavigate={onNavigate} />;
    case 'about':
      return <AboutScreen variant={variant} onNavigate={onNavigate} />;
    case 'signin':
      return <SignInPreview key={variant} variant={variant} onNavigate={onNavigate} />;
    case 'signup':
      return <SignUpPreview key={variant} variant={variant} onNavigate={onNavigate} />;
    case 'profile':
      return <ProfileScreen variant={variant} onNavigate={onNavigate} onSelectVariant={onSelectVariant} profile={profile} onApplyProfile={onApplyProfile} />;
    case 'chat':
      return <ChatScreen variant={variant} />;
    case 'post':
      return <PostScreen key={variant} variant={variant} />;
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
  onSelectVariant,
}: {
  variant: VariantId;
  onNavigate: (screen: ScreenId) => void;
  onSelectVariant: (variant: VariantId) => void;
}): JSX.Element {
  const [appliedFilters, setAppliedFilters] = useState<SearchFilterValues>(emptySearchFilters);
  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);
  const searchAdverts = variant === 'long' ? [longAdvert, ...previewAdverts.slice(1)] : previewAdverts;
  const filteredAdverts = searchAdverts.filter((advert) => {
    const includes = (value: string, query: string): boolean => (
      value.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru'))
    );
    return (
      (!appliedFilters.city || advert.city === appliedFilters.city)
      && (!appliedFilters.priceTo || advert.price <= Number(appliedFilters.priceTo))
      && (!appliedFilters.roomsFrom || advert.rooms >= Number(appliedFilters.roomsFrom))
      && includes(advert.district, appliedFilters.district)
      && includes(advert.metro, appliedFilters.metro)
      && appliedFilters.tagIds.every((tagId) => advert.tags.includes(previewTagCatalog.tags.find((tag) => tag.id === tagId)?.name ?? ''))
    );
  });
  const visibleAdverts = variant === 'partial' ? filteredAdverts.slice(0, 2) : filteredAdverts;
  const listings = visibleAdverts.map((advert) => ({
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
  let resultsState = SearchResultsState.Ready;
  if (variant === 'loading') resultsState = SearchResultsState.Loading;
  if (variant === 'empty') resultsState = SearchResultsState.Empty;
  if (variant === 'error') resultsState = SearchResultsState.Error;

  return (
    <main className="preview-page">
      <div className="preview-page-heading">
        <h2>Найти жильё</h2>
        <p>Выбирайте варианты по цене, месту и условиям.</p>
      </div>
      <SearchFilters
        tagCatalog={previewTagCatalog}
        applied={appliedFilters}
        onApply={setAppliedFilters}
      />
      <SearchResults
        listings={listings}
        state={resultsState}
        onOpenListing={() => onNavigate('detail')}
        onSaveListing={(id, saved) => {
          setSavedListingIds((current) => (
            saved ? [...new Set([...current, id])] : current.filter((savedId) => savedId !== id)
          ));
        }}
        onResetFilters={() => {
          setAppliedFilters(emptySearchFilters);
          onSelectVariant('data');
        }}
        onRetry={() => onSelectVariant('data')}
      />
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
  const [savedIds, setSavedIds] = useState<string[]>([]);
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
      <ListingHeader title={advert.title} photos={photos} onBack={() => onNavigate('search')} />
      <ListingDetails
        information={{
          rooms: advert.rooms,
          area: advert.area,
          floor: advert.floor,
          description: advert.description,
          tags: advert.tags,
          location: { city: advert.city, district: advert.district, metro: advert.metro },
        }}
        contact={{ price: advert.price, author: advert.author, authorCity: advert.city }}
        saved={savedIds.includes(advert.id)}
        contactDisabled={variant === 'disabled-contact'}
        onContact={() => onNavigate('signin')}
        onSavedChange={(saved) => setSavedIds((current) => (
          saved ? [...new Set([...current, advert.id])] : current.filter((id) => id !== advert.id)
        ))}
      />
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
      <AboutBanner description={description} onBrowseListings={() => onNavigate('search')} />
      <AboutSteps />
    </main>
  );
}

function SignInPreview({
  variant,
  onNavigate,
}: {
  variant: VariantId;
  onNavigate: (screen: ScreenId) => void;
}): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = password.trim().length > 0;
  const isError = variant === 'error';
  const isLoading = variant === 'loading';
  let feedback: SignInFeedback | undefined;
  if (isError) {
    feedback = { variant: AlertVariant.Error, message: 'Не удалось выполнить вход. Проверьте данные.' };
  } else if (submitted && emailValid && passwordValid) {
    feedback = { variant: AlertVariant.Info, message: 'Данные введены. В preview вход не выполняется.' };
  }
  let emailError: string | undefined;
  if (isError) {
    emailError = 'Проверьте адрес email.';
  } else if (submitted && !emailValid) {
    emailError = 'Введите корректный email.';
  }

  return (
    <main className="preview-page">
      <SignInCard
        email={email}
        password={password}
        emailError={emailError}
        passwordError={submitted && !passwordValid ? 'Введите пароль.' : undefined}
        feedback={feedback}
        loading={isLoading}
        disabled={variant === 'disabled'}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={() => setSubmitted(true)}
        onRegister={() => onNavigate('signup')}
        onBrowseListings={() => onNavigate('search')}
      />
    </main>
  );
}

function SignUpPreview({
  variant,
  onNavigate,
}: {
  variant: VariantId;
  onNavigate: (screen: ScreenId) => void;
}): JSX.Element {
  const [values, setValues] = useState<SignUpValues>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const isError = variant === 'error';
  const errors: Partial<Record<keyof SignUpValues, string>> = {};
  if (isError || (submitted && !values.name.trim())) {
    errors.name = 'Введите имя.';
  }
  if (submitted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Введите корректный email.';
  }
  if (submitted && (values.password.length < 9 || !/\d/.test(values.password))) {
    errors.password = 'Не менее 9 символов и одна цифра.';
  }
  if (submitted && values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Пароли не совпадают.';
  }
  let feedback: SignUpFeedback | undefined;
  if (isError) {
    feedback = { variant: AlertVariant.Error, message: 'Не удалось создать профиль. Проверьте данные.' };
  } else if (submitted && Object.keys(errors).length === 0) {
    feedback = { variant: AlertVariant.Info, message: 'Данные заполнены. В preview регистрация не выполняется.' };
  }

  return (
    <main className="preview-page">
      <SignUpCard
        values={values}
        errors={errors}
        feedback={feedback}
        loading={variant === 'loading'}
        onChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
        onSubmit={() => setSubmitted(true)}
        onSignIn={() => onNavigate('signin')}
        onBrowseListings={() => onNavigate('search')}
      />
    </main>
  );
}

function ProfileScreen({
  variant,
  onNavigate,
  onSelectVariant,
  profile,
  onApplyProfile,
}: {
  variant: VariantId;
  onNavigate: (screen: ScreenId) => void;
  onSelectVariant: (variant: VariantId) => void;
  profile: ProfileDetails;
  onApplyProfile: (profile: ProfileDetails, avatarFile: File | null | undefined) => void;
}): JSX.Element {
  const [savedIds, setSavedIds] = useState<string[]>(
    () => [longAdvert.id, ...profileFixture.favorites.map(({ id }) => id)],
  );
  const [returnVariant, setReturnVariant] = useState<VariantId>('filled');
  const [editingSource, setEditingSource] = useState<ProfileDetails | null | undefined>();
  const isLong = variant === 'long';
  const visibleProfile = variant === 'empty-profile' ? null : {
    ...profile,
    name: isLong ? 'Александр Петров с очень длинным именем для проверки переноса на узком экране' : profile.name,
    description: isLong ? longAdvert.description : profile.description,
    avatarUrl: variant === 'avatar-fallback' ? '/images/missing-profile-avatar.jpg' : profile.avatarUrl,
  };
  const favorites = variant === 'empty' || variant === 'empty-favorites'
    ? []
    : (isLong ? [longAdvert, ...previewAdverts] : previewAdverts)
      .filter(({ id }) => savedIds.includes(id));
  const myAdverts = variant === 'empty' || variant === 'empty-listings'
    ? []
    : profileFixture.myAdverts;

  if (variant === 'editing') {
    return (
      <ProfileEditForm
        profile={editingSource === undefined ? profile : editingSource}
        onSave={(nextProfile, avatarFile) => {
          onApplyProfile(nextProfile, avatarFile);
          setEditingSource(undefined);
          onSelectVariant('filled');
        }}
        onCancel={() => {
          setEditingSource(undefined);
          onSelectVariant(returnVariant);
        }}
      />
    );
  }

  return <ProfilePage
    profile={visibleProfile}
    favorites={toProfileListings(favorites, savedIds)}
    myListings={toProfileListings(myAdverts, savedIds)}
    onCreateListing={() => onNavigate('post')}
    onEditProfile={() => {
      setReturnVariant(variant);
      setEditingSource(visibleProfile);
      onSelectVariant('editing');
    }}
    onFindListings={() => onNavigate('search')}
    onOpenListing={() => onNavigate('detail')}
    onSaveListing={(id, saved) => setSavedIds((current) => saved
      ? [...current.filter((item) => item !== id), id]
      : current.filter((item) => item !== id))}
  />;
}

function ChatScreen({ variant }: { variant: VariantId }): JSX.Element {
  const isEmpty = variant === 'empty';
  const noSelection = variant === 'no-selection';
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    isEmpty || noSelection ? null : previewConversations[0].id,
  );
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>(
    () => Object.fromEntries(previewConversations.map(({ id, messages }) => [id, messages])),
  );

  useEffect(() => {
    setSelectedConversationId(isEmpty || noSelection ? null : previewConversations[0].id);
  }, [isEmpty, noSelection]);

  const conversations = isEmpty ? [] : previewConversations.map((conversation, index) => {
    const messages = messagesByConversation[conversation.id] ?? conversation.messages;
    return {
      ...conversation,
      receiverId: index + 1,
      listing: { id: previewAdverts[index].id, title: conversation.advert, price: previewAdverts[index].price, imageUrl: previewAdverts[index].image },
      lastMessage: messages[messages.length - 1]?.text ?? conversation.lastMessage,
      messages: messages.map((message) => ({ ...message, text: variant === 'long' && message.id === 'm2' ? longMessage : message.text })),
      price: previewAdverts[index].price,
      imageUrl: previewAdverts[index].image,
    };
  });

  return (
    <ChatPage
      conversations={conversations}
      selectedConversationId={selectedConversationId}
      empty={isEmpty}
      onSelectConversation={setSelectedConversationId}
      onBackToList={() => setSelectedConversationId(null)}
      onSendMessage={(conversationId, message) => {
        if (variant === 'send-error') return false;
        setMessagesByConversation((current) => ({
          ...current,
          [conversationId]: [
            ...(current[conversationId] ?? []),
            { id: `local-${Date.now()}`, from: 'me', text: message },
          ],
        }));
        return true;
      }}
    />
  );
}

function PostScreen({ variant }: { variant: VariantId }): JSX.Element {
  const stepMatch = variant.match(/^step-(\d)/);
  let initialStep = stepMatch ? Number(stepMatch[1]) : 1;
  if (['publish-loading', 'publish-error', 'published'].includes(variant)) initialStep = 4;

  const initialDraft = { ...postFixture, tagIds: previewTagCatalog.tags.filter((tag) => ['Для некурящих', 'Тихие вечера'].includes(tag.name)).map((tag) => tag.id) };
  if (variant === 'step-1-error') {
    initialDraft.title = '';
    initialDraft.city = '';
    initialDraft.metro = '';
    initialDraft.area = '';
  }
  if (variant === 'step-2-error') {
    initialDraft.price = '';
    initialDraft.description = '';
  }
  if (variant === 'long') {
    initialDraft.title = longAdvert.title;
    initialDraft.description = longAdvert.description;
  }

  let initialPublishState = ListingCreatePublishState.Idle;
  if (variant === 'publish-loading') initialPublishState = ListingCreatePublishState.Loading;
  if (variant === 'publish-error') initialPublishState = ListingCreatePublishState.Error;
  if (variant === 'published') initialPublishState = ListingCreatePublishState.Success;
  let initialAttemptedSteps: number[] = [];
  if (variant === 'step-1-error') initialAttemptedSteps = [1];
  if (variant === 'step-2-error') initialAttemptedSteps = [2];

  const publishPreview = async (): Promise<void> => {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 600);
    });
    if (variant === 'publish-error') throw new Error('Preview publication failed');
  };

  return (
    <ListingCreatePage
      tagCatalog={previewTagCatalog}
      initialStep={initialStep}
      initialDraft={initialDraft}
      initialAttemptedSteps={initialAttemptedSteps}
      initialPublishState={initialPublishState}
      onPublish={publishPreview}
    />
  );
}

export default PreviewApp;

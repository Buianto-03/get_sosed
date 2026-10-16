import { routes } from '@shared/config/routes';

export type HeaderPage =
  | 'home'
  | 'search'
  | 'about'
  | 'signin'
  | 'signup'
  | 'profile'
  | 'chat'
  | 'post';

export const headerRoutes: Record<HeaderPage, string> = {
  home: routes.home,
  search: routes.listings,
  about: routes.about,
  signin: routes.signIn,
  signup: routes.signUp,
  profile: routes.profile,
  chat: routes.messages,
  post: routes.listingCreate,
};

export type HeaderNavItem = { page: HeaderPage; label: string };

export const primaryItems: HeaderNavItem[] = [
  { page: 'home', label: 'Главная' },
  { page: 'search', label: 'Поиск' },
  { page: 'about', label: 'О нас' },
];

export const guestMobileItems: HeaderNavItem[] = [
  { page: 'signup', label: 'Регистрация' },
  { page: 'chat', label: 'Сообщения' },
];

export const memberMobileItems: HeaderNavItem[] = [
  { page: 'post', label: 'Разместить объявление' },
  { page: 'chat', label: 'Сообщения' },
  { page: 'profile', label: 'Профиль' },
];

export type HeaderPage =
  | 'home'
  | 'search'
  | 'detail'
  | 'about'
  | 'signin'
  | 'signup'
  | 'profile'
  | 'chat'
  | 'post';

export const headerRoutes: Record<HeaderPage, string> = {
  home: '/',
  search: '/home',
  detail: '/advert/1',
  about: '/about',
  signin: '/signin',
  signup: '/signup',
  profile: '/account',
  chat: '/chat/1',
  post: '/post',
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

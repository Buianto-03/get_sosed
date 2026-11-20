import React from 'react';
import { routes } from '@shared/config/routes';
import type { HeaderPage } from '@widgets/header/navigation';
import type { MobileNavigationItem } from '@widgets/mobile-navigation/MobileNavigation';
import { LuHome, LuPlus, LuSearch, LuUser, LuMessagesSquare } from 'react-icons/lu';

export const getAvailableRoutes = (isLoggedIn: boolean): HeaderPage[] =>
  isLoggedIn
    ? ['home', 'search', 'about', 'post', 'profile', 'chat', 'signin']
    : ['home', 'search', 'about', 'post', 'profile', 'chat', 'signin', 'signup'];

export const mobileItems: MobileNavigationItem[] = [
  {
    id: 'home',
    label: 'Главная',
    to: routes.home,
    activePaths: [routes.home],
    icon: <LuHome aria-hidden="true" />,
  },
  {
    id: 'search',
    label: 'Поиск',
    to: routes.listings,
    activePaths: [routes.listings],
    excludePaths: [routes.listingCreate],
    icon: <LuSearch aria-hidden="true" />,
  },
  {
    id: 'post',
    label: 'Подать',
    to: routes.listingCreate,
    activePaths: [routes.listingCreate],
    icon: <LuPlus aria-hidden="true" />,
  },
  {
    id: 'chat',
    label: 'Чаты',
    to: routes.messages,
    activePaths: [routes.messages],
    icon: <LuMessagesSquare aria-hidden="true" />,
  },
  {
    id: 'profile',
    label: 'Профиль',
    to: routes.profile,
    activePaths: [routes.profile],
    icon: <LuUser aria-hidden="true" />,
  },
];

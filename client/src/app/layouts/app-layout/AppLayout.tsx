import React, { useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { LuHome, LuPlus, LuSearch, LuUser } from 'react-icons/lu';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { logoutThunk } from '@features/logout/thunks';
import { UserStatus } from '@entities/session/model/auth';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { RoutePattern, routes } from '@shared/config/routes';
import { MobileNavigation } from '@widgets/mobile-navigation/MobileNavigation';
import type { MobileNavigationItem } from '@widgets/mobile-navigation/MobileNavigation';
import type { HeaderPage } from '@widgets/header/navigation';
import { SiteLayout } from '../SiteLayout';

export default function AppLayout(): JSX.Element {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const [logoutError, setLogoutError] = useState(false);
  const isLoggedIn = user.status === UserStatus.Logged;
  const availableRoutes: HeaderPage[] = isLoggedIn
    ? ['home', 'search', 'post', 'profile', 'signin']
    : ['home', 'search', 'post', 'signin', 'signup'];
  const mobileItems: MobileNavigationItem[] = [
    { id: 'home', label: 'Главная', to: routes.home, activePaths: [routes.home], icon: <LuHome aria-hidden="true" /> },
    { id: 'search', label: 'Поиск', to: routes.listings, activePaths: [routes.listings], excludePaths: [routes.listingCreate], icon: <LuSearch aria-hidden="true" /> },
    { id: 'post', label: 'Подать', to: routes.listingCreate, activePaths: [routes.listingCreate], icon: <LuPlus aria-hidden="true" /> },
    ...(isLoggedIn
      ? [{ id: 'profile', label: 'Профиль', to: routes.profile, activePaths: [routes.profile], icon: <LuUser aria-hidden="true" /> }]
      : []),
  ];

  const signOut = (): void => {
    void dispatch(logoutThunk()).unwrap()
      .then(() => setLogoutError(false))
      .catch(() => setLogoutError(true));
  };

  return (
    <SiteLayout
      user={isLoggedIn ? {
        name: user.name,
        avatarUrl: user.UserProfile?.photo ?? undefined,
      } : undefined}
      onSignOut={isLoggedIn ? signOut : undefined}
      availableRoutes={availableRoutes}
      footerLinks={{ showAbout: false, showSearch: true, showListingCreate: true }}
      fullscreenChat={location.pathname.startsWith(`${RoutePattern.Messages}/`)}
      bottomNavigation={<MobileNavigation items={mobileItems} />}
    >
      {logoutError && (
        <Alert variant={AlertVariant.Error} title="Не удалось выйти">
          Проверьте соединение и попробуйте ещё раз.
        </Alert>
      )}
      <Outlet />
    </SiteLayout>
  );
}

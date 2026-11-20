import React, { useMemo, useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { logoutThunk } from '@features/logout/thunks';
import { UserStatus } from '@entities/session/model/authModel';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { RoutePattern } from '@shared/config/routes';
import { MobileNavigation } from '@widgets/mobile-navigation/MobileNavigation';
import { selectAuthUser } from '@entities/session/model/authSelector';
import { SiteLayout } from '../site-layout/SiteLayout';
import { getAvailableRoutes, mobileItems } from './helper';

export default function AppLayout(): JSX.Element {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const user = useAppSelector(selectAuthUser);
  const [logoutError, setLogoutError] = useState(false);
  const isLoggedIn = user.status === UserStatus.Logged;
  const fullscreenChat = useMemo(
    () =>
      location.pathname === String(RoutePattern.Messages) ||
      location.pathname.startsWith(`${RoutePattern.Messages}/`),
    [location.pathname],
  );

  const availableRoutes = useMemo(() => getAvailableRoutes(isLoggedIn), [isLoggedIn]);

  const signOut = (): void => {
    void dispatch(logoutThunk())
      .unwrap()
      .then(() => setLogoutError(false))
      .catch(() => setLogoutError(true));
  };

  return (
    <SiteLayout
      onSignOut={isLoggedIn ? signOut : undefined}
      availableRoutes={availableRoutes}
      fullscreenChat={fullscreenChat}
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

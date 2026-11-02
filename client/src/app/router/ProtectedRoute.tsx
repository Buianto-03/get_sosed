import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { UserStatus } from '@entities/session/model/authModel';
import { routes } from '@shared/config/routes';
import type { RoutePattern } from '@shared/config/routes';
import { Spinner } from '@shared/ui/feedback/Spinner';
import {
  getAuthenticationPath,
  getPostAuthDestination,
} from '@shared/lib/navigation/safe-return-to';
import { useAppSelector } from '../store/hooks';

type ProtectedRouteProps = {
  access: 'logged' | 'guest';
  children?: JSX.Element;
  redirect?: RoutePattern.SignIn;
};

export default function ProtectedRoute({
  children,
  access,
  redirect = routes.signIn,
}: ProtectedRouteProps): JSX.Element {
  const status = useAppSelector((state) => state.auth.user.status);
  const location = useLocation();

  if (status === UserStatus.Pending) return <Spinner label="Проверяем сессию" />;
  if (access === 'logged' && status !== UserStatus.Logged) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={getAuthenticationPath(redirect, returnTo)} replace />;
  }
  if (access === 'guest' && status === UserStatus.Logged) {
    const returnTo = new URLSearchParams(location.search).get('returnTo');
    return <Navigate to={getPostAuthDestination(returnTo)} replace />;
  }

  return children || <Outlet />;
}

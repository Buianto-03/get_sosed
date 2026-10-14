import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { UserStatus } from '@entities/session/model/auth';
import { useAppSelector } from '../store/hooks';

type ProtectedRouteProps = {
  access: 'logged' | 'guest';
  children?: JSX.Element;
  redirect?: string;
};

export default function ProtectedRoute({
  children,
  access,
  redirect = '/',
}: ProtectedRouteProps): JSX.Element {
  const status = useAppSelector((state) => state.auth.user.status);
  if (status === UserStatus.Pending) return <div>Загрузка...</div>;
  if ((access === 'logged' && status !== UserStatus.Logged)
    || (access === 'guest' && status !== UserStatus.Guest)) {
    return <Navigate to={redirect} replace />;
  }
  return children || <Outlet />;
}

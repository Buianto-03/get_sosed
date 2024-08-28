import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

type ProtectedRouteProps = {
  isAllowed: boolean;
  children?: JSX.Element;
  redirect?: string;
};

export default function ProtectedRoute({
  children,
  isAllowed,
  redirect = '/',
}: ProtectedRouteProps): JSX.Element {
  if (!isAllowed) return <Navigate to={redirect} />;
  return children || <Outlet />;
}

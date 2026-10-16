import React from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { NotFoundPage } from '@pages/not-found/ui/not-found-page/NotFoundPage';
import { RoutePattern, routes } from '@shared/config/routes';
import AppLayout from '@app/layouts/app-layout/AppLayout';
import ProtectedRoute from './ProtectedRoute';

const AccountPage = React.lazy(() => import('@pages/account/AccountPage'));
const SignInPage = React.lazy(() => import('@pages/sign-in/SignInPage'));
const SignUpPage = React.lazy(() => import('@pages/sign-up/SignUpPage'));
const MainPage = React.lazy(() => import('@pages/search/MainPage'));
const AdvertPage = React.lazy(() => import('@pages/advert-details/AdvertPage'));
const ChatPage = React.lazy(() => import('@pages/chat/ChatPage'));
const PostAdvertPage = React.lazy(() => import('@pages/advert-create/PostAdvertPage'));
const WelcomePage = React.lazy(() => import('@pages/welcome/WelcomePage'));

export const appRouteObjects: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <WelcomePage />,
      },
      {
        path: RoutePattern.Profile,
        element: (
          <ProtectedRoute access="logged" redirect={routes.signIn}>
            <AccountPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/messages/:receiverId',
        element: (
          <ProtectedRoute access="logged" redirect={routes.signIn}>
            <ChatPage />
          </ProtectedRoute>
        ),
      },
      {
        path: RoutePattern.SignIn,
        element: (
          <ProtectedRoute access="guest" redirect="/">
            <SignInPage />
          </ProtectedRoute>
        ),
      },
      {
        path: RoutePattern.SignUp,
        element: (
          <ProtectedRoute access="guest" redirect="/">
            <SignUpPage />
          </ProtectedRoute>
        ),
      },
      {
        path: RoutePattern.Listings,
        element: <MainPage />,
      },
      {
        path: RoutePattern.ListingCreate,
        element: (
          <ProtectedRoute access="logged" redirect={routes.signIn}>
            <PostAdvertPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/listings/:listingId',
        element: <AdvertPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
];

const router = createBrowserRouter(appRouteObjects);

export default router;

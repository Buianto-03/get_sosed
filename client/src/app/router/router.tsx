import React from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { NotFoundPage } from '@pages/not-found/ui/not-found-page/NotFoundPage';
import { RoutePattern, routes } from '@shared/config/routes';
import AppLayout from '@app/layouts/app-layout/AppLayout';
import ProtectedRoute from './ProtectedRoute';

const AboutPage = React.lazy(() => import('@pages/about/ui/about-page/AboutPage'));
const ProfileEditRoute = React.lazy(
  () => import('@pages/profile/ui/profile-edit-route/ProfileEditRoute'),
);
const ProfileRoute = React.lazy(() => import('@pages/profile/ui/profile-route/ProfileRoute'));
const SignInPage = React.lazy(() => import('@pages/sign-in/ui/sign-in-route/SignInRoute'));
const SignUpPage = React.lazy(() => import('@pages/sign-up/ui/sign-up-route/SignUpRoute'));
const SearchRoute = React.lazy(() => import('@pages/search/ui/search-route/SearchRoute'));
const ListingRoute = React.lazy(
  () => import('@pages/advert-details/ui/listing-route/ListingRoute'),
);
const MessagesRoute = React.lazy(() => import('@pages/chat/ui/messages-route/MessagesRoute'));
const ListingCreateRoute = React.lazy(
  () => import('@pages/listing-create/ui/listing-create-route/ListingCreateRoute'),
);
const WelcomePage = React.lazy(() => import('@pages/welcome/ui/home-route/HomeRoute'));

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
        path: RoutePattern.About,
        element: <AboutPage />,
      },
      {
        path: RoutePattern.Profile,
        element: (
          <ProtectedRoute access="logged" redirect={routes.signIn}>
            <ProfileRoute />
          </ProtectedRoute>
        ),
      },
      {
        path: RoutePattern.ProfileEdit,
        element: (
          <ProtectedRoute access="logged">
            <ProfileEditRoute />
          </ProtectedRoute>
        ),
      },
      {
        path: RoutePattern.Messages,
        element: (
          <ProtectedRoute access="logged">
            <MessagesRoute />
          </ProtectedRoute>
        ),
      },
      {
        path: '/messages/:receiverId',
        element: (
          <ProtectedRoute access="logged" redirect={routes.signIn}>
            <MessagesRoute />
          </ProtectedRoute>
        ),
      },
      {
        path: RoutePattern.SignIn,
        element: (
          <ProtectedRoute access="guest">
            <SignInPage />
          </ProtectedRoute>
        ),
      },
      {
        path: RoutePattern.SignUp,
        element: (
          <ProtectedRoute access="guest">
            <SignUpPage />
          </ProtectedRoute>
        ),
      },
      {
        path: RoutePattern.Listings,
        element: <SearchRoute />,
      },
      {
        path: RoutePattern.ListingCreate,
        element: (
          <ProtectedRoute access="logged" redirect={routes.signIn}>
            <ListingCreateRoute />
          </ProtectedRoute>
        ),
      },
      {
        path: '/listings/:listingId',
        element: <ListingRoute />,
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

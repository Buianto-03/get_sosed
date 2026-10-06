import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../layouts/BaseLayout';
import ProtectedRoute from './ProtectedRoute';

const AccountPage = React.lazy(() => import('@pages/account/AccountPage'));
const SignInPage = React.lazy(() => import('@pages/sign-in/SignInPage'));
const SignUpPage = React.lazy(() => import('@pages/sign-up/SignUpPage'));
const MainPage = React.lazy(() => import('@pages/search/MainPage'));
const AdvertPage = React.lazy(() => import('@pages/advert-details/AdvertPage'));
const ChatPage = React.lazy(() => import('@pages/chat/ChatPage'));
const PostAdvertPage = React.lazy(() => import('@pages/advert-create/PostAdvertPage'));
const WelcomePage = React.lazy(() => import('@pages/welcome/WelcomePage'));

const router = createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      children: [
        {
          path: '/',
          element: <WelcomePage />,
        },
        {
          path: '/account',
          element: (
            <ProtectedRoute access="logged" redirect="/signin">
              <AccountPage />
            </ProtectedRoute>
          ),
          // element: status === UserStatus.Logged ? <AccountPage /> : <div>Hello</div>,
        },
        {
          path: '/chat/:receiverId',
          element: (
            <ProtectedRoute access="logged" redirect="/signin">
              <ChatPage />
            </ProtectedRoute>
          ),
          // element: status === UserStatus.Logged ? <ChatPage /> : <div>Hello</div>,
        },
        {
          path: '/signin',
          element: (
            <ProtectedRoute access="guest" redirect="/">
              <SignInPage />
            </ProtectedRoute>
          ),

          // element: <SignInPage />,
        },
        {
          path: '/signup',
          element: (
            <ProtectedRoute access="guest" redirect="/">
              <SignUpPage />
            </ProtectedRoute>
          ),
          // element: <SignUpPage />,
        },
        {
          path: '/home',
          element: (
            // <ProtectedRoute isAllowed={user.status === UserStatus.Logged} redirect="/signin">
            <MainPage />
            // </ProtectedRoute>
          ),
          //  element: <MainPage />
        },
        {
          path: '/advert/:id',
          element: <AdvertPage />,
          // element: <AdvertPage />,
        },
        {
          path: '/post',
          element: (
            <ProtectedRoute access="logged" redirect="/signin">
              <PostAdvertPage />
            </ProtectedRoute>
          ),
        },
        {
          path: '*',
          element: <Navigate to="/" />,
        },
      ],
    },
  ]);

export default router;

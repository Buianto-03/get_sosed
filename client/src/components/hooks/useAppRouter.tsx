import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../Layout';
import AccountPage from '../pages/Account/AccountPage';
import SignInPage from '../pages/SignInPage/SignInPage';
import SignUpPage from '../pages/SignUpPage/SignUpPage';
import MainPage from '../pages/main/MainPage';
import AdvertPage from '../pages/AdvertPage/AdvertPage';
import { useAppSelector } from '../../redux/hooks';
import { UserStatus } from '../../types/auth';
import ChatPage from '../pages/Account/ChatPage';
import PostAdvertPage from '../pages/PostAdvertPage/PostAdvertPage';
import ProtectedRoute from './ProtectedRoute';
import WelcomePage from '../pages/WelcomePage/WelcomePage';

export default function useAppRouter(): ReturnType<typeof createBrowserRouter> {
  const user = useAppSelector((store) => store.auth.user);
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
            <ProtectedRoute isAllowed={user.status === UserStatus.Logged} redirect="/signin">
              <AccountPage />
            </ProtectedRoute>
          ),
          // element: status === UserStatus.Logged ? <AccountPage /> : <div>Hello</div>,
        },
        {
          path: '/chat/:receiverId',
          element: (
            <ProtectedRoute isAllowed={user.status === UserStatus.Logged} redirect="/signin">
              <ChatPage />
            </ProtectedRoute>
          ),
          // element: status === UserStatus.Logged ? <ChatPage /> : <div>Hello</div>,
        },
        {
          path: '/signin',
          element: (
            <ProtectedRoute isAllowed={user.status === UserStatus.Guest} redirect="/">
              <SignInPage />
            </ProtectedRoute>
          ),

          // element: <SignInPage />,
        },
        {
          path: '/signup',
          element: (
            <ProtectedRoute isAllowed={user.status === UserStatus.Guest} redirect="/">
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
            // (
            //   <ProtectedRoute isAllowed={user.status === UserStatus.Logged} redirect="/signin">
            <PostAdvertPage />
          ),
          //   </ProtectedRoute>
          // ),
          // element: <PostAdvertPage />,
        },
      ],
    },
  ]);

  return router;
}

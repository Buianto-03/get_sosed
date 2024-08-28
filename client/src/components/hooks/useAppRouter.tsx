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

export default function useAppRouter(): ReturnType<typeof createBrowserRouter> {
  const status = useAppSelector((store) => store.auth.user.status);
  console.log(status);
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      children: [
        {
          path: '/account',
          element: status === UserStatus.Logged ? <AccountPage /> : <div>Hello</div>,
        },
        {
          path: '/chat/:receiverId',
          element: status === UserStatus.Logged ? <ChatPage /> : <div>Hello</div>,
        },
        {
          path: '/signin',
          element: <SignInPage />,
        },
        {
          path: '/signup',
          element: <SignUpPage />,
        },
        { path: '/', element: <MainPage /> },
        {
          path: '/advert/:id',
          element: <AdvertPage />,
        },
        {
          path: '/post',
          element: <PostAdvertPage />,
        },
      ],
    },
  ]);

  return router;
}

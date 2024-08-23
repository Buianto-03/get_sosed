import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../Layout';
import AccountPage from '../pages/Account/AccountPage';
import SignInPage from '../pages/SignInPage/SignInPage';
import SignUpPage from '../pages/SignUpPage/SignUpPage';
import MainPage from '../pages/main/MainPage';
import AdvertPage from '../pages/AdvertPage/AdvertPage';

export default function useAppRouter(): ReturnType<typeof createBrowserRouter> {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      children: [
        {
          path: '/account',
          element: <AccountPage />,
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
        }
      ],
    },
  ]);

  return router;
}

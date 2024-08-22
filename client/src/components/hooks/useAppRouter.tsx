import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../Layout';
import AccountPage from '../pages/Account/AccountPage';
import SignInPage from '../pages/SignInPage/SignInPage';

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
      ],
    },
  ]);

  return router;
}

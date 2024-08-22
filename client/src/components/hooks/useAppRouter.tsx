import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../Layout';
import AccountPage from '../pages/Account/AccountPage';
import MainPage from '../pages/main/MainPage';

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
        { path: '/', element: <MainPage /> },
      ],
    },
  ]);

  return router;
}

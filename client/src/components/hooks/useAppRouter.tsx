import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../Layout';

export default function useAppRouter(): ReturnType<typeof createBrowserRouter> {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      children: [
      ],
    },
  ]);

  return router;
}

import React from 'react';
import { RouterProvider } from 'react-router-dom';
import useAppRouter from './components/hooks/useAppRouter';

function App(): JSX.Element {
  const router = useAppRouter();
  return <RouterProvider router={router} />;
}

export default App;

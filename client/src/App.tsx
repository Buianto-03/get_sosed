import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import useAppRouter from './components/hooks/useAppRouter';
import { getAdvertsThunk } from './redux/slices/adverts/advertsThunk';
import { useAppDispatch } from './redux/hooks';

function App(): JSX.Element {
  const router = useAppRouter();
  const dispatch = useAppDispatch();
  useEffect(() => {
    void dispatch(getAdvertsThunk());
  }, []);
  return <RouterProvider router={router} />;
}

export default App;

import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import useAppRouter from './components/hooks/useAppRouter';
import { useAppDispatch } from './redux/hooks';
import { checkAuthThunk } from './redux/slices/auth/thunks';
import { getAdvertsThunk } from './redux/slices/adverts/advertsThunk';

function App(): JSX.Element {
  const dispatch = useAppDispatch();
  const router = useAppRouter();

  useEffect(() => {
    void dispatch(checkAuthThunk());
    void dispatch(getAdvertsThunk());
    
  }, []);

  return <RouterProvider router={router} />;
}

export default App;

import React, { Suspense, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { checkAuthThunk } from '@entities/session/model/authThunk';
import { useAppDispatch } from './store/hooks';
import { useChatConnection } from './hooks/useChatConnection';
import router from './router/router';

function App(): JSX.Element {
  const dispatch = useAppDispatch();
  useChatConnection();

  useEffect(() => {
    void dispatch(checkAuthThunk());
  }, [dispatch]);

  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default App;

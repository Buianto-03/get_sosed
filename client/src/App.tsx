import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import useAppRouter from './components/hooks/useAppRouter';
import { useAppDispatch } from './redux/hooks';
import { checkAuthThunk } from './redux/slices/auth/thunks';

function App(): JSX.Element {
  const dispatch = useAppDispatch();
  const router = useAppRouter();

  useEffect(() => {
    void dispatch(checkAuthThunk());
    // void dispatch(getAdvertsThunk());
    // dispatch getTagsByStringTagsThunk  <---
    // tags=Квартира,Кухня ->>> stringTags: ['Квартира', 'Кухня'] ->>> tags: [{id: 1, name: 'Квартира'}, {id: 2, name: 'Кухня'}]
    
  }, [dispatch]);

  return <RouterProvider router={router} />;
}

export default App;

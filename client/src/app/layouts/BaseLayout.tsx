import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '@widgets/header/Navbar';
import Loader from '@shared/ui/Loader';
import { UserStatus } from '@entities/session/model/authModel';
import Footer from '@widgets/footer/Footer';
import { useAppSelector } from '../store/hooks';

export default function Layout(): JSX.Element {
  const user = useAppSelector((store) => store.auth.user);
  return (
    <Loader loading={user.status === UserStatus.Pending}>
      <>
        <Navbar />
        <Outlet />
        <Footer />
      </>
    </Loader>
  );
}

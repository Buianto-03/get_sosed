import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../widgets/header/Navbar';
import Loader from '../../shared/ui/Loader';
import { useAppSelector } from '../store/hooks';
import { UserStatus } from '../../entities/session/model/auth';
import Footer from '../../widgets/footer/Footer';

export default function Layout(): JSX.Element {
  const user = useAppSelector((store) => store.auth.user)
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

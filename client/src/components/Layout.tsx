import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './ui/Navbar';
import Loader from './HOC/Loader';
import { useAppSelector } from '../redux/hooks';
import { UserStatus } from '../types/auth';
import Footer from './ui/Footer';

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

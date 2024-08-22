import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './ui/Navbar';

export default function Layout(): JSX.Element {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

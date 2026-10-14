import React from 'react';
import { NavLink } from 'react-router-dom';
import { headerRoutes, type HeaderPage } from './navigation';
import styles from './SiteHeader.module.scss';

type HeaderNavLinkProps = {
  page: HeaderPage;
  label: string;
  mobile?: boolean;
  onSelect: () => void;
};

export function HeaderNavLink({
  page,
  label,
  mobile = false,
  onSelect,
}: HeaderNavLinkProps): JSX.Element {
  return (
    <NavLink
      to={headerRoutes[page]}
      className={mobile ? styles.mobileLink : styles.navLink}
      onClick={onSelect}
    >
      {label}
    </NavLink>
  );
}

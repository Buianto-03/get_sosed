import React from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import { routes } from '@shared/config/routes';
import { getAuthenticationPath } from '@shared/lib/navigation/safe-return-to';
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
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  let to = headerRoutes[page];
  if (page === 'signin') to = getAuthenticationPath(routes.signIn, returnTo);
  if (page === 'signup') to = getAuthenticationPath(routes.signUp, returnTo);

  return (
    <NavLink
      to={to}
      className={mobile ? styles.mobileLink : styles.navLink}
      onClick={onSelect}
    >
      {label}
    </NavLink>
  );
}

import React from 'react';
import { NavLink } from 'react-router-dom';
import { routes } from '@shared/config/routes';
import styles from './SiteFooter.module.scss';

export interface SiteFooterProps {
  showAbout?: boolean;
  showSearch?: boolean;
  showListingCreate?: boolean;
}

export function SiteFooter({
  showAbout = true,
  showSearch = true,
  showListingCreate = true,
}: SiteFooterProps): JSX.Element {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <strong>GETSOSED</strong>
          <span>Жильё и люди рядом</span>
        </div>
        <nav className={styles.links} aria-label="Навигация в подвале">
          {showAbout && <NavLink to={routes.about}>О нас</NavLink>}
          {showSearch && <NavLink to={routes.listings}>Поиск</NavLink>}
          {showListingCreate && <NavLink to={routes.listingCreate}>Разместить объявление</NavLink>}
        </nav>
      </div>
    </footer>
  );
}

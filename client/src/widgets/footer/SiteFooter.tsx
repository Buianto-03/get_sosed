import React from 'react';
import { NavLink } from 'react-router-dom';
import { routes } from '@shared/config/routes';
import styles from './SiteFooter.module.scss';

export function SiteFooter(): JSX.Element {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <strong>GETSOSED</strong>
          <span>Жильё и люди рядом</span>
        </div>
        <nav className={styles.links} aria-label="Навигация в подвале">
          <NavLink to={routes.about}>О нас</NavLink>
          <NavLink to={routes.listings}>Поиск</NavLink>
          <NavLink to={routes.listingCreate}>Разместить объявление</NavLink>
        </nav>
      </div>
    </footer>
  );
}

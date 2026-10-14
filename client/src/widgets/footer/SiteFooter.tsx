import React from 'react';
import { NavLink } from 'react-router-dom';
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
          {/* проверить */}
          <NavLink to="/about">О нас</NavLink>
          <NavLink to="/home">Поиск</NavLink>
          <NavLink to="/post">Разместить объявление</NavLink>
        </nav>
      </div>
    </footer>
  );
}

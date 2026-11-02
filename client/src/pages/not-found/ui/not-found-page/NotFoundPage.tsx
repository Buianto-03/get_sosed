import React from 'react';
import { Link } from 'react-router-dom';
import { Heading, HeadingLevel, HeadingSize } from '@shared/ui/heading/Heading';
import { routes } from '@shared/config/routes';
import styles from './NotFoundPage.module.scss';

export function NotFoundPage(): JSX.Element {
  return (
    <main className={styles.page}>
      <p className={styles.code} aria-hidden="true">404</p>
      <Heading className={styles.title} level={HeadingLevel.H1} size={HeadingSize.Xl}>
        Страница не найдена
      </Heading>
      <p className={styles.description}>
        Такой страницы нет. Откройте главную или перейдите к поиску объявлений.
      </p>
      <nav className={styles.actions} aria-label="Навигация со страницы ошибки">
        <Link className={`${styles.action} ${styles.primary}`} to={routes.home}>
          На главную
        </Link>
        <Link className={styles.action} to={routes.listings}>
          К поиску
        </Link>
      </nav>
    </main>
  );
}

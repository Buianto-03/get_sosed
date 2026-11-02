import React, { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './MobileNavigation.module.scss';

export interface MobileNavigationItem {
  id: string;
  label: string;
  to: string;
  activePaths: readonly string[];
  excludePaths?: readonly string[];
  icon: ReactNode;
}

export interface MobileNavigationProps {
  items: readonly MobileNavigationItem[];
}

function isActivePath(pathname: string, path: string): boolean {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function MobileNavigation({ items }: MobileNavigationProps): JSX.Element {
  const location = useLocation();

  return (
    <nav className={styles.navigation} aria-label="Мобильная навигация">
      {items.map((item) => {
        const active = item.activePaths.some((path) => (
          isActivePath(location.pathname, path)
        )) && !item.excludePaths?.some((path) => isActivePath(location.pathname, path));

        return (
          <Link
            key={item.id}
            className={styles.item}
            to={item.to}
            aria-current={active ? 'page' : undefined}
          >
            {item.icon}
            <span className={styles.label}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

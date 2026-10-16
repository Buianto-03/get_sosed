import React, { useEffect, useId, useRef, useState } from 'react';
import { LuHome, LuMenu, LuX } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { Button, ButtonSize, ButtonVariant } from '@shared/ui/button/Button';
import { HeaderNavLink } from './HeaderNavLink';
import { HeaderProfileMenu, type HeaderUser } from './HeaderProfileMenu';
import {
  guestMobileItems,
  headerRoutes,
  memberMobileItems,
  primaryItems,
  type HeaderPage,
} from './navigation';
import styles from './SiteHeader.module.scss';

export type SiteHeaderProps = {
  user?: HeaderUser;
  onSignOut?: () => void;
  availableRoutes?: readonly HeaderPage[];
};

export function SiteHeader({ user, onSignOut, availableRoutes }: SiteHeaderProps): JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const menuTriggerRef = useRef<HTMLSpanElement>(null);
  const userName = user?.name;
  const closeMobileMenu = (): void => setMobileMenuOpen(false);
  const isRouteAvailable = (page: HeaderPage): boolean => (
    availableRoutes === undefined || availableRoutes.includes(page)
  );

  useEffect(() => setMobileMenuOpen(false), [userName]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const handlePointerDown = (event: MouseEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) setMobileMenuOpen(false);
    };
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        menuTriggerRef.current?.querySelector('button')?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mobileMenuOpen]);

  return (
    <header ref={rootRef} className={styles.header}>
      <Link
        to={headerRoutes.home}
        className={styles.brand}
        aria-label="GETSOSED — Главная"
        onClick={closeMobileMenu}
      >
        <span className={styles.brandIcon}>
          <LuHome aria-hidden="true" />
        </span>
        <span>GETSOSED</span>
      </Link>

      <nav className={styles.desktopNav} aria-label="Основная навигация">
        {primaryItems.filter(({ page }) => isRouteAvailable(page)).map(({ page, label }) => (
          <HeaderNavLink key={page} page={page} label={label} onSelect={closeMobileMenu} />
        ))}
        {user ? (
          <>
            {isRouteAvailable('post') && (
              <Link to={headerRoutes.post} className={styles.headerCta}>
                Разместить объявление
              </Link>
            )}
            <HeaderProfileMenu
              user={user}
              onSignOut={onSignOut}
              availableRoutes={availableRoutes}
            />
          </>
        ) : (
          <>
            {isRouteAvailable('signin') && (
              <HeaderNavLink page="signin" label="Войти" onSelect={closeMobileMenu} />
            )}
            {isRouteAvailable('signup') && (
              <Link to={headerRoutes.signup} className={styles.headerCta}>
                Регистрация
              </Link>
            )}
          </>
        )}
      </nav>

      <div className={styles.mobileActions}>
        <span ref={menuTriggerRef}>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Sm}
            className={styles.menuTrigger}
            aria-expanded={mobileMenuOpen}
            aria-controls={menuId}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <LuX aria-hidden="true" /> : <LuMenu aria-hidden="true" />}
            Меню
          </Button>
        </span>
        {user ? (
          <HeaderProfileMenu
            user={user}
            onSignOut={onSignOut}
            availableRoutes={availableRoutes}
          />
        ) : (
          isRouteAvailable('signin') && (
            <HeaderNavLink page="signin" label="Войти" mobile onSelect={closeMobileMenu} />
          )
        )}
      </div>

      {mobileMenuOpen && (
        <nav id={menuId} className={styles.mobileMenu} aria-label="Мобильное меню">
          {primaryItems.filter(({ page }) => isRouteAvailable(page)).map(({ page, label }) => (
            <HeaderNavLink key={page} page={page} label={label} mobile onSelect={closeMobileMenu} />
          ))}
          {(user ? memberMobileItems : guestMobileItems)
            .filter(({ page }) => isRouteAvailable(page))
            .map(({ page, label }) => (
              <HeaderNavLink key={page} page={page} label={label} mobile onSelect={closeMobileMenu} />
            ))}
          {user && onSignOut && (
            <Button
              variant={ButtonVariant.Text}
              className={styles.mobileSignOut}
              onClick={() => {
                setMobileMenuOpen(false);
                onSignOut();
              }}
            >
              Выйти
            </Button>
          )}
        </nav>
      )}
    </header>
  );
}

import React, { type ReactNode } from 'react';
import { SiteHeader, type SiteHeaderProps } from '@widgets/header/SiteHeader';
import { SiteFooter } from '@widgets/footer/SiteFooter';
import styles from './SiteLayout.module.scss';

type SiteLayoutProps = SiteHeaderProps & {
  children: ReactNode;
  bottomNavigation?: ReactNode;
  fullscreenChat?: boolean;
};

export function SiteLayout({
  children,
  bottomNavigation,
  fullscreenChat = false,
  user,
  onSignOut,
}: SiteLayoutProps): JSX.Element {
  return (
    <div className={styles.shell}>
      <SiteHeader user={user} onSignOut={onSignOut} />
      <div className={[styles.content, fullscreenChat && styles.chatContent].filter(Boolean).join(' ')}>
        {children}
      </div>
      {!fullscreenChat && <SiteFooter />}
      {bottomNavigation}
    </div>
  );
}

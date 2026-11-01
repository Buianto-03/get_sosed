import React, { type ReactNode } from 'react';
import { SiteHeader, type SiteHeaderProps } from '@widgets/header/SiteHeader';
import { SiteFooter, type SiteFooterProps } from '@widgets/footer/SiteFooter';
import styles from './SiteLayout.module.scss';

interface SiteLayoutProps extends SiteHeaderProps {
  children: ReactNode;
  bottomNavigation?: ReactNode;
  fullscreenChat?: boolean;
  footerLinks?: SiteFooterProps;
}

export function SiteLayout({
  children,
  bottomNavigation,
  fullscreenChat = false,
  user,
  onSignOut,
  availableRoutes,
  footerLinks,
}: SiteLayoutProps): JSX.Element {
  return (
    <div className={[styles.shell, fullscreenChat && styles.shell_chat].filter(Boolean).join(' ')}>
      <SiteHeader user={user} onSignOut={onSignOut} availableRoutes={availableRoutes} />
      <div
        className={[styles.content, fullscreenChat && styles.chatContent].filter(Boolean).join(' ')}
      >
        {children}
      </div>
      {!fullscreenChat && (
        <SiteFooter
          showAbout={footerLinks?.showAbout}
          showSearch={footerLinks?.showSearch}
          showListingCreate={footerLinks?.showListingCreate}
        />
      )}
      {bottomNavigation}
    </div>
  );
}

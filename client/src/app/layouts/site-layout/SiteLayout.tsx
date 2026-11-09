import React, { type ReactNode } from 'react';
import { SiteHeader, type SiteHeaderProps } from '@widgets/header/SiteHeader';
import { SiteFooter } from '@widgets/footer/SiteFooter';
import { SiteContent } from '../site-content/SiteContent';
import { SkipLink } from '../skip-link/SkipLink';
import { version } from '../../../../package.json';
import styles from './SiteLayout.module.scss';

const contentId = 'route-content';

interface SiteLayoutProps extends SiteHeaderProps {
  children: ReactNode;
  bottomNavigation?: ReactNode;
  fullscreenChat?: boolean;
}

export function SiteLayout({
  children,
  bottomNavigation,
  fullscreenChat = false,
  user,
  onSignOut,
  availableRoutes,
}: SiteLayoutProps): JSX.Element {
  return (
    <div
      className={[styles.shell, fullscreenChat && styles.shell_chat].filter(Boolean).join(' ')}
      data-version={version}
    >
      <SkipLink targetId={contentId} />
      <SiteHeader user={user} onSignOut={onSignOut} availableRoutes={availableRoutes} />
      <SiteContent id={contentId} fullscreenChat={fullscreenChat}>
        {children}
      </SiteContent>
      {!fullscreenChat && <SiteFooter />}
      {bottomNavigation}
    </div>
  );
}

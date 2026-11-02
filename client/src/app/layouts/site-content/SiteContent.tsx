import React, { type ReactNode } from 'react';
import { useRouteContentFocus } from './use-route-content-focus';
import styles from './SiteContent.module.scss';

interface SiteContentProps {
  id: string;
  children: ReactNode;
  fullscreenChat?: boolean;
}

export function SiteContent({ id, children, fullscreenChat = false }: SiteContentProps): JSX.Element {
  const contentRef = useRouteContentFocus();

  return (
    <div
      ref={contentRef}
      id={id}
      data-route-content
      tabIndex={-1}
      className={[styles.site_content, fullscreenChat && styles.site_content_chat].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}

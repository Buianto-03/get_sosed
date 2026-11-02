import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar, AvatarSize } from '@shared/ui/avatar/Avatar';
import { Menu } from '@shared/ui/overlay/Menu';
import { RoutePattern } from '@shared/config/routes';
import { headerRoutes, type HeaderPage } from './navigation';
import styles from './SiteHeader.module.scss';

export type HeaderUser = {
  name: string;
  avatarUrl?: string;
};

type HeaderProfileMenuProps = {
  user: HeaderUser;
  onSignOut?: () => void;
  availableRoutes?: readonly HeaderPage[];
};

export function HeaderProfileMenu({ user, onSignOut, availableRoutes }: HeaderProfileMenuProps): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const profileSectionActive =
    location.pathname === headerRoutes.profile ||
    location.pathname.startsWith(`${headerRoutes.profile}/`) ||
    location.pathname === headerRoutes.chat ||
    location.pathname === headerRoutes.post ||
    location.pathname.startsWith(`${RoutePattern.Messages}/`);

  return (
    <Menu
      label={`Меню профиля: ${user.name}`}
      className={[styles.profileMenu, profileSectionActive && styles.activeProfile]
        .filter(Boolean)
        .join(' ')}
      trigger={
        <span className={styles.profileTrigger}>
          <Avatar name={user.name} src={user.avatarUrl} size={AvatarSize.Sm} />
          <span className={styles.profileName}>{user.name}</span>
        </span>
      }
      items={[
        ...(availableRoutes === undefined || availableRoutes.includes('profile')
          ? [{ label: 'Профиль', onSelect: () => navigate(headerRoutes.profile) }]
          : []),
        ...(availableRoutes === undefined || availableRoutes.includes('chat')
          ? [{ label: 'Сообщения', onSelect: () => navigate(headerRoutes.chat) }]
          : []),
        ...(onSignOut ? [{ label: 'Выйти', onSelect: onSignOut }] : []),
      ]}
    />
  );
}

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar, AvatarSize } from '@shared/ui/avatar/Avatar';
import { Menu } from '@shared/ui/overlay/Menu';
import { headerRoutes } from './navigation';
import styles from './SiteHeader.module.scss';

export type HeaderUser = {
  name: string;
  avatarUrl?: string;
};

type HeaderProfileMenuProps = {
  user: HeaderUser;
  onSignOut?: () => void;
};

export function HeaderProfileMenu({ user, onSignOut }: HeaderProfileMenuProps): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const profileSectionActive =
    location.pathname === headerRoutes.profile ||
    location.pathname === headerRoutes.post ||
    location.pathname.startsWith('/chat/');

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
        { label: 'Профиль', onSelect: () => navigate(headerRoutes.profile) },
        { label: 'Сообщения', onSelect: () => navigate(headerRoutes.chat) },
        ...(onSignOut ? [{ label: 'Выйти', onSelect: onSignOut }] : []),
      ]}
    />
  );
}

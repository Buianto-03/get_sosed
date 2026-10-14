/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Avatar, AvatarSize, type AvatarProps } from './Avatar';
import styles from './AvatarGroup.module.scss';

export type AvatarGroupProps = {
  avatars: Omit<AvatarProps, 'size' | 'className'>[];
  label: string;
  max?: number;
  size?: AvatarSize;
  className?: string;
};

export function AvatarGroup({
  avatars,
  label,
  max = 4,
  size = AvatarSize.Md,
  className,
}: AvatarGroupProps): JSX.Element {
  const visibleAvatars = avatars.slice(0, max);
  const remaining = Math.max(0, avatars.length - visibleAvatars.length);
  const classes = [styles.group, className].filter(Boolean).join(' ');

  return (
    <div className={classes} role="group" aria-label={label}>
      {visibleAvatars.map((avatar) => (
        <Avatar key={avatar.name} {...avatar} size={size} />
      ))}
      {remaining > 0 && (
        <span
          className={[styles.overflow, styles[size]].join(' ')}
          role="img"
          aria-label={`Скрыто участников: ${remaining}`}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
}

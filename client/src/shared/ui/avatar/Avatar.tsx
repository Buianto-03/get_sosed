import React, { useState } from 'react';
import styles from './Avatar.module.scss';

export enum AvatarSize {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
  Xl = 'xl',
}

export type AvatarProps = {
  name: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
};

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toLocaleUpperCase();
}

export function Avatar({
  name,
  src,
  size = AvatarSize.Md,
  className,
}: AvatarProps): JSX.Element {
  const [failedSrc, setFailedSrc] = useState<string>();
  const classes = [styles.avatar, styles[size], className].filter(Boolean).join(' ');

  if (src && failedSrc !== src) {
    return (
      <img
        className={classes}
        src={src}
        alt={name}
        onError={() => setFailedSrc(src)}
      />
    );
  }

  return (
    <span className={classes} role="img" aria-label={name}>
      {getInitials(name)}
    </span>
  );
}

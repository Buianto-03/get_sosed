import React, { type ReactNode } from 'react';
import styles from './Badge.module.scss';

export enum BadgeVariant {
  Neutral = 'neutral',
  Accent = 'accent',
  Success = 'success',
  Warning = 'warning',
}

export enum BadgeSize {
  Sm = 'sm',
  Md = 'md',
}

export type BadgeProps = {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
};

export function Badge({
  variant = BadgeVariant.Neutral,
  size = BadgeSize.Sm,
  children,
  className,
}: BadgeProps): JSX.Element {
  const classes = [styles.badge, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{children}</span>;
}

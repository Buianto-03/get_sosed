/* eslint-disable react/jsx-props-no-spreading */
import React, { type AnchorHTMLAttributes, type ReactNode } from 'react';
import styles from './Link.module.scss';

export enum LinkVariant {
  Default = 'default',
  Subtle = 'subtle',
}

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: LinkVariant;
  children: ReactNode;
};

export function Link({
  variant = LinkVariant.Default,
  className,
  children,
  ...nativeProps
}: LinkProps): JSX.Element {
  const classes = [styles.link, styles[variant], className].filter(Boolean).join(' ');

  return (
    <a {...nativeProps} className={classes}>
      {children}
    </a>
  );
}

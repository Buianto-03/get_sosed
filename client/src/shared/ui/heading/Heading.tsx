import React, { type ReactNode } from 'react';
import styles from './Heading.module.scss';

export enum HeadingLevel {
  H1 = 1,
  H2 = 2,
  H3 = 3,
  H4 = 4,
  H5 = 5,
  H6 = 6,
}

export enum HeadingSize {
  Display = 'display',
  Xl = 'xl',
  Lg = 'lg',
  Md = 'md',
  Sm = 'sm',
}

export type HeadingProps = {
  level: HeadingLevel;
  size?: HeadingSize;
  children: ReactNode;
  className?: string;
};

export function Heading({
  level,
  size = HeadingSize.Lg,
  children,
  className,
}: HeadingProps): JSX.Element {
  const Tag = `h${level}` as const;
  const classes = [styles.heading, styles[size], className].filter(Boolean).join(' ');

  return <Tag className={classes}>{children}</Tag>;
}

import React from 'react';
import styles from './Divider.module.scss';

type DividerProps = {
  className?: string;
};

export function Divider({ className }: DividerProps): JSX.Element {
  const classes = [styles.divider, className].filter(Boolean).join(' ');

  return <hr className={classes} />;
}

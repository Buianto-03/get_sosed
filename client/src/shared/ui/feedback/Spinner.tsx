import React from 'react';
import styles from './Spinner.module.scss';

export enum SpinnerSize {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

export type SpinnerProps = {
  size?: SpinnerSize;
  label?: string;
  className?: string;
};

export function Spinner({
  size = SpinnerSize.Md,
  label = 'Загрузка',
  className,
}: SpinnerProps): JSX.Element {
  return (
    <span
      className={[styles.spinner, styles[size], className].filter(Boolean).join(' ')}
      role="status"
      aria-label={label}
    >
      <span className={styles.ring} aria-hidden="true" />
    </span>
  );
}

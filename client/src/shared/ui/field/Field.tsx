import React, { type ReactNode } from 'react';
import styles from './Field.module.scss';

export type FieldPresentationProps = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  disabled?: boolean;
};

export type FieldProps = FieldPresentationProps & {
  children: ReactNode;
  className?: string;
};

export function Field({
  id,
  label,
  required = false,
  hint,
  error,
  disabled = false,
  children,
  className,
}: FieldProps): JSX.Element {
  const classes = [styles.field, disabled && styles.disabled, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required && <span className={styles.required} aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && (
        <span className={styles.hint} id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span className={styles.error} id={`${id}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

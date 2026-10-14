/* eslint-disable react/jsx-props-no-spreading */
import React, { type InputHTMLAttributes } from 'react';
import styles from './Checkbox.module.scss';

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'id' | 'size'
> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  fieldClassName?: string;
};

export function Checkbox({
  id,
  label,
  hint,
  error,
  disabled = false,
  required = false,
  className,
  fieldClassName,
  ...inputProps
}: CheckboxProps): JSX.Element {
  const describedBy = [
    inputProps['aria-describedby'],
    hint ? `${id}-hint` : undefined,
    error ? `${id}-error` : undefined,
  ].filter(Boolean).join(' ');
  const classes = [styles.checkboxField, disabled && styles.disabled, fieldClassName]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <label className={styles.label} htmlFor={id}>
        <input
          {...inputProps}
          id={id}
          className={[styles.input, className].filter(Boolean).join(' ')}
          type="checkbox"
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : inputProps['aria-invalid']}
          aria-describedby={describedBy || undefined}
        />
        <span className={styles.labelText}>{label}</span>
        {required && <span className={styles.required} aria-hidden="true">*</span>}
      </label>
      {hint && <span className={styles.hint} id={`${id}-hint`}>{hint}</span>}
      {error && (
        <span className={styles.error} id={`${id}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

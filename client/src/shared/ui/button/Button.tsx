/* eslint-disable react/jsx-props-no-spreading */
import React, { type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './Button.module.scss';

export enum ButtonVariant {
  Primary = 'primary',
  Secondary = 'secondary',
  Text = 'text',
}

export enum ButtonSize {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

export enum ButtonType {
  Native = 'button',
  Submit = 'submit',
  Reset = 'reset',
}

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: ButtonType;
  loading?: boolean;
  children: ReactNode;
};

export function Button({
  variant = ButtonVariant.Primary,
  size = ButtonSize.Md,
  type = ButtonType.Native,
  loading = false,
  disabled = false,
  className,
  children,
  ...nativeProps
}: ButtonProps): JSX.Element {
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');
  const isDisabled = disabled || loading;

  return (
    <button
      {...nativeProps}
      className={classes}
      // eslint-disable-next-line react/button-has-type
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
}

/* eslint-disable react/jsx-props-no-spreading */
import React, { type ButtonHTMLAttributes, type ReactNode } from 'react';
import {
  Button,
  ButtonSize,
  ButtonType,
  ButtonVariant,
  type ButtonProps,
} from './Button';
import styles from './IconButton.module.scss';

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'type'
> & {
  icon: ReactNode;
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: ButtonType;
  loading?: boolean;
};

export function IconButton({
  icon,
  label,
  variant = ButtonVariant.Secondary,
  size = ButtonSize.Md,
  type = ButtonType.Native,
  loading = false,
  className,
  ...nativeProps
}: IconButtonProps): JSX.Element {
  const sizeClasses: Record<ButtonSize, string> = {
    [ButtonSize.Sm]: styles.iconSm,
    [ButtonSize.Md]: styles.iconMd,
    [ButtonSize.Lg]: styles.iconLg,
  };
  const sizeClass = sizeClasses[size];
  const buttonProps: ButtonProps = {
    ...nativeProps,
    variant,
    size,
    type,
    loading,
    className: [styles.iconButton, sizeClass, className].filter(Boolean).join(' '),
    'aria-label': label,
    children: icon,
  };

  return <Button {...buttonProps} />;
}

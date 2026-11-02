import React, { type ReactNode } from 'react';
import { LuAlertCircle, LuCheckCircle2, LuInfo, LuTriangle } from 'react-icons/lu';
import styles from './Alert.module.scss';

export enum AlertVariant {
  Info = 'info',
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

export type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
};

const variantIcons: Record<AlertVariant, ReactNode> = {
  [AlertVariant.Info]: <LuInfo aria-hidden="true" />,
  [AlertVariant.Success]: <LuCheckCircle2 aria-hidden="true" />,
  [AlertVariant.Warning]: <LuTriangle aria-hidden="true" />,
  [AlertVariant.Error]: <LuAlertCircle aria-hidden="true" />,
};

export function Alert({
  variant = AlertVariant.Info,
  title,
  children,
  className,
}: AlertProps): JSX.Element {
  const role = variant === AlertVariant.Error ? 'alert' : 'status';
  return (
    <div
      className={[styles.alert, styles[variant], className].filter(Boolean).join(' ')}
      role={role}
      aria-live={variant === AlertVariant.Error ? 'assertive' : 'polite'}
    >
      <span className={styles.icon}>{variantIcons[variant]}</span>
      <div className={styles.content}>
        {title && <strong className={styles.title}>{title}</strong>}
        <div>{children}</div>
      </div>
    </div>
  );
}

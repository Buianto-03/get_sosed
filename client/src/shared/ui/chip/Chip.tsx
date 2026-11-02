import React, { type ReactNode } from 'react';
import { LuX } from 'react-icons/lu';
import styles from './Chip.module.scss';

export enum ChipVariant {
  Neutral = 'neutral',
  Accent = 'accent',
  Soft = 'soft',
}

export enum ChipSize {
  Sm = 'sm',
  Md = 'md',
}

export type ChipProps = {
  label: string;
  variant?: ChipVariant;
  size?: ChipSize;
  icon?: ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
};

export function Chip({
  label,
  variant = ChipVariant.Neutral,
  size = ChipSize.Md,
  icon,
  onRemove,
  removeLabel,
  className,
}: ChipProps): JSX.Element {
  const classes = [styles.chip, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      <span className={styles.label}>{label}</span>
      {onRemove && (
        <button
          className={styles.remove}
          type="button"
          aria-label={removeLabel || `Убрать «${label}»`}
          onClick={onRemove}
        >
          <LuX aria-hidden="true" />
        </button>
      )}
    </span>
  );
}

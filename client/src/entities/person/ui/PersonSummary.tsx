import React from 'react';
import { Avatar, AvatarSize } from '@shared/ui/avatar/Avatar';
import { Chip, ChipSize, ChipVariant } from '@shared/ui/chip/Chip';
import styles from './PersonSummary.module.scss';

export enum PersonSummaryVariant {
  Compact = 'compact',
  Profile = 'profile',
}

export type PersonSummaryProps = {
  name: string;
  avatarUrl?: string;
  city?: string;
  description?: string;
  tags?: string[];
  variant?: PersonSummaryVariant;
  action?: React.ReactNode;
};

export function PersonSummary({
  name,
  avatarUrl,
  city,
  description,
  tags = [],
  variant = PersonSummaryVariant.Compact,
  action,
}: PersonSummaryProps): JSX.Element {
  return (
    <section className={[styles.summary, styles[variant]].join(' ')}>
      <Avatar name={name} src={avatarUrl} size={variant === PersonSummaryVariant.Profile ? AvatarSize.Xl : AvatarSize.Lg} />
      <div className={styles.details}>
        <h3>{name}</h3>
        {city && <p className={styles.meta}>{city}</p>}
        {description && <p className={styles.description}>{description}</p>}
        {tags.length > 0 && (
          <div className={styles.tags} aria-label="О пользователе">
            {tags.map((tag) => <Chip key={tag} label={tag} size={ChipSize.Sm} variant={ChipVariant.Neutral} />)}
          </div>
        )}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </section>
  );
}

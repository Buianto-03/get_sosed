import React from 'react';
import { Avatar } from '@shared/ui/avatar/Avatar';
import styles from './ConversationRow.module.scss';

export interface ConversationRowProps {
  name: string;
  listingTitle?: string;
  avatarUrl?: string;
  lastMessage: string;
  time?: string;
  active?: boolean;
  onSelect?: () => void;
}

export function ConversationRow({
  name,
  avatarUrl,
  listingTitle,
  lastMessage,
  time,
  active = false,
  onSelect,
}: ConversationRowProps): JSX.Element {
  return (
    <button
      className={[styles.row, active && styles.active].filter(Boolean).join(' ')}
      type="button"
      aria-current={active ? 'true' : undefined}
      onClick={onSelect}
    >
      <Avatar name={name} src={avatarUrl} />
      <span className={styles.details}>
        <strong>{name}</strong>
        {listingTitle && <span className={styles.listing}>{listingTitle}</span>}
        <span className={styles.message}>{lastMessage}</span>
      </span>
      {time && <time>{time}</time>}
    </button>
  );
}

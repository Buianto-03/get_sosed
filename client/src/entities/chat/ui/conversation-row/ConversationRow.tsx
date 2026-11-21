import React, { memo } from 'react';
import { Avatar } from '@shared/ui/avatar/Avatar';
import styles from './ConversationRow.module.scss';

export interface ConversationRowProps {
  id: string;
  name: string;
  listingTitle?: string;
  avatarUrl?: string;
  lastMessage: string;
  time?: string;
  active?: boolean;
  onSelect: (id: string) => void;
}

function ConversationRowView({
  id,
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
      onClick={() => onSelect(id)}
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

export const ConversationRow = memo(ConversationRowView);

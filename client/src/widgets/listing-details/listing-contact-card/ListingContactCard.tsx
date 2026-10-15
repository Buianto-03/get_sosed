import React from 'react';
import { LuHeart } from 'react-icons/lu';
import { PersonSummary } from '@entities/person/ui/PersonSummary';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import { Surface } from '@shared/ui/surface/Surface';
import styles from './ListingContactCard.module.scss';

export interface ListingContactData {
  price: number;
  author: string;
  authorCity?: string;
}

interface ListingContactCardProps {
  contact: ListingContactData;
  saved: boolean;
  contactDisabled: boolean;
  onContact: () => void;
  onSavedChange: (saved: boolean) => void;
}

export function ListingContactCard({
  contact,
  saved,
  contactDisabled,
  onContact,
  onSavedChange,
}: ListingContactCardProps): JSX.Element {
  return (
    <aside className={styles.listingContactCard} aria-label="Связь с автором">
      <Surface className={styles.listingContactCard__surface}>
        <strong className={styles.listingContactCard__price}>
          {contact.price.toLocaleString('ru-RU')} ₽
        </strong>
        <p className={styles.listingContactCard__note}>Период и предмет аренды уточняются у автора</p>
        <div className={styles.listingContactCard__author}>
          <PersonSummary name={contact.author} city={contact.authorCity} />
        </div>
        <div className={styles.listingContactCard__actions}>
          <Button className={styles.listingContactCard__button} disabled={contactDisabled} onClick={onContact}>
            Написать автору
          </Button>
          <Button
            className={styles.listingContactCard__button}
            variant={ButtonVariant.Secondary}
            aria-pressed={saved}
            onClick={() => onSavedChange(!saved)}
          >
            <LuHeart aria-hidden="true" fill={saved ? 'currentColor' : 'none'} />
            {saved ? 'В избранном' : 'В избранное'}
          </Button>
        </div>
      </Surface>
    </aside>
  );
}

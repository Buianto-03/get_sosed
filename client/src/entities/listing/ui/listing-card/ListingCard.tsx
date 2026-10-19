import React from 'react';
import { LuHeart, LuImageOff } from 'react-icons/lu';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import { IconButton } from '@shared/ui/button/IconButton';
import { Chip, ChipSize, ChipVariant } from '@shared/ui/chip/Chip';
import styles from './ListingCard.module.scss';

export enum ListingCardVariant {
  Home = 'home',
  Search = 'search',
  Profile = 'profile',
}

export type ListingCardData = {
  title: string;
  price: number | null;
  imageUrl?: string;
  imageAlt?: string;
  city?: string;
  district?: string;
  metro?: string;
  tags?: readonly string[];
};

export interface ListingCardProps {
  listing: ListingCardData;
  variant?: ListingCardVariant;
  saved: boolean;
  onSavedChange: (saved: boolean) => void;
  onOpen: () => void;
  saveDisabled?: boolean;
  saveError?: string;
}

export function ListingCard({
  listing,
  variant = ListingCardVariant.Search,
  saved,
  onSavedChange,
  onOpen,
  saveDisabled = false,
  saveError,
}: ListingCardProps): JSX.Element {
  const location = [listing.city, listing.district, listing.metro].filter(Boolean).join(' · ');

  return (
    <article className={[styles.card, styles[variant]].join(' ')}>
      <button
        className={styles.imageButton}
        type="button"
        onClick={onOpen}
        aria-label={`Открыть объявление: ${listing.title}`}
      >
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt={listing.imageAlt || listing.title} />
        ) : (
          <span className={styles.imagePlaceholder}>
            <LuImageOff aria-hidden="true" />
            Фото не добавлено
          </span>
        )}
      </button>
      <div className={styles.content}>
        <div className={styles.topline}>
          <strong>
            {listing.price === null
              ? 'Цена не указана'
              : `${listing.price.toLocaleString('ru-RU')} ₽`}
          </strong>
          <IconButton
            className={[styles.saveButton, saved && styles.saved].filter(Boolean).join(' ')}
            icon={<LuHeart aria-hidden="true" />}
            label={saved ? 'Убрать из избранного' : 'Сохранить объявление'}
            disabled={saveDisabled}
            aria-pressed={saved}
            onClick={() => onSavedChange(!saved)}
          />
        </div>
        {saveError && <p role="alert">{saveError}</p>}
        <h3>{listing.title}</h3>
        {location && <p className={styles.location}>{location}</p>}
        {Boolean(listing.tags?.length) && (
          <div className={styles.tags} aria-label="Условия">
            {listing.tags?.map((tag) => (
              <Chip key={tag} label={tag} size={ChipSize.Sm} variant={ChipVariant.Accent} />
            ))}
          </div>
        )}
        <Button className={styles.detailsButton} variant={ButtonVariant.Secondary} onClick={onOpen}>
          Подробнее
        </Button>
      </div>
    </article>
  );
}

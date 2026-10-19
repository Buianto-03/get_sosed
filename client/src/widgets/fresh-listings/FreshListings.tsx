import React from 'react';
import {
  ListingCard,
  ListingCardVariant,
  type ListingCardData,
} from '@entities/listing/ui/listing-card/ListingCard';
import { EmptyState } from '@shared/ui/feedback/EmptyState';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import { Spinner } from '@shared/ui/feedback/Spinner';
import styles from './FreshListings.module.scss';

export enum FreshListingsState {
  Loading = 'loading',
  Ready = 'ready',
  Error = 'error',
}

export interface HomeListing {
  id: string;
  listing: ListingCardData;
  saved: boolean;
  saveDisabled?: boolean;
  saveError?: string;
}

export interface FreshListingsProps {
  listings: readonly HomeListing[];
  onOpenListing: (id: string) => void;
  onSaveListing: (id: string, saved: boolean) => void;
  onViewAllListings: () => void;
  state?: FreshListingsState;
  onRetry?: () => void;
}

export function FreshListings({
  listings,
  onOpenListing,
  onSaveListing,
  onViewAllListings,
  state = FreshListingsState.Ready,
  onRetry,
}: FreshListingsProps): JSX.Element {
  return (
    <section className={styles.collection} aria-labelledby="home-listings-heading">
      <div className={styles.collectionHeading}>
        <div>
          <p className={styles.kicker}>Подборка</p>
          <h2 id="home-listings-heading">Свежие объявления</h2>
        </div>
        <button className={styles.viewAll} type="button" onClick={onViewAllListings}>
          Все объявления →
        </button>
      </div>
      {state === FreshListingsState.Loading && <Spinner label="Загружаем свежие объявления" />}
      {state === FreshListingsState.Error && <>
        <Alert variant={AlertVariant.Error}>Не удалось загрузить свежие объявления.</Alert>
        <Button variant={ButtonVariant.Secondary} onClick={onRetry}>Повторить</Button>
      </>}
      {state === FreshListingsState.Ready && (listings.length > 0 ? (
        <div className={styles.listingGrid}>
          {listings.map(({ id, listing, saved, saveDisabled, saveError }) => (
            <ListingCard
              key={id}
              listing={listing}
              variant={ListingCardVariant.Home}
              saved={saved}
              saveDisabled={saveDisabled}
              saveError={saveError}
              onSavedChange={(nextSaved) => onSaveListing(id, nextSaved)}
              onOpen={() => onOpenListing(id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="Подборка пока пуста" description="Новые объявления появятся здесь." />
      ))}
    </section>
  );
}

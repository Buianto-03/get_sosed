import React from 'react';
import {
  ListingCard,
  ListingCardVariant,
  type ListingCardData,
} from '../../entities/listing/ui/ListingCard';
import { EmptyState } from '../../shared/ui/feedback/EmptyState';
import styles from './FreshListings.module.scss';

export type HomeListing = {
  id: string;
  listing: ListingCardData;
  saved: boolean;
};

export type FreshListingsProps = {
  listings: readonly HomeListing[];
  onOpenListing: (id: string) => void;
  onSaveListing: (id: string, saved: boolean) => void;
  onViewAllListings: () => void;
};

export function FreshListings({
  listings,
  onOpenListing,
  onSaveListing,
  onViewAllListings,
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
      {listings.length > 0 ? (
        <div className={styles.listingGrid}>
          {listings.map(({ id, listing, saved }) => (
            <ListingCard
              key={id}
              listing={listing}
              variant={ListingCardVariant.Home}
              saved={saved}
              onSavedChange={(nextSaved) => onSaveListing(id, nextSaved)}
              onOpen={() => onOpenListing(id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="Подборка пока пуста" description="Новые объявления появятся здесь." />
      )}
    </section>
  );
}

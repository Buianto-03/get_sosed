import React from 'react';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { Spinner } from '@shared/ui/feedback/Spinner';
import {
  ListingCard,
  ListingCardVariant,
  type ListingCardData,
} from '@entities/listing/ui/listing-card/ListingCard';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import { EmptyState } from '@shared/ui/feedback/EmptyState';
import { Heading, HeadingLevel, HeadingSize } from '@shared/ui/heading/Heading';
import styles from './ProfileListingsSection.module.scss';

export type ProfileListing = {
  id: string;
  listing: ListingCardData;
  saved: boolean;
  saveDisabled?: boolean;
  saveError?: string;
};

export interface ProfileCollection {
  items: readonly ProfileListing[];
  total: number;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  pagination?: {
    hasMore: boolean;
    loading: boolean;
    error: string | null;
    onLoadMore: () => void;
  };
}

export interface ProfileListingActions {
  onOpen: (id: string) => void;
  onToggleSaved: (id: string) => void;
}

interface ProfileListingsSectionProps {
  headingId: string;
  title: string;
  collection: ProfileCollection;
  emptyState: {
    title: string;
    description: string;
    action: React.ReactNode;
    icon: React.ReactNode;
  };
  actions: ProfileListingActions;
}

export function ProfileListingsSection({
  headingId,
  title,
  collection,
  emptyState,
  actions,
}: ProfileListingsSectionProps): JSX.Element {
  return (
    <section className={styles.collection} aria-labelledby={headingId}>
      <div className={styles.collection__heading}>
        <Heading level={HeadingLevel.H2} size={HeadingSize.Lg} className={styles.collection__title}>
          <span id={headingId}>{title}</span>
        </Heading>
        {collection.items.length > 0 && (
          <span className={styles.collection__count}>{collection.total}</span>
        )}
      </div>
      {collection.loading && <Spinner label={`Загрузка: ${title}`} />}
      {!collection.loading && collection.error && (
        <>
          <Alert variant={AlertVariant.Error}>{collection.error}</Alert>
          <Button onClick={collection.onRetry}>Повторить</Button>
        </>
      )}
      {!collection.loading &&
        !collection.error &&
        (collection.items.length > 0 ? (
          <div className={styles.collection__grid}>
            {collection.items.map(({ id, listing, saved, saveDisabled, saveError }) => (
              <ListingCard
                key={id}
                listing={listing}
                variant={ListingCardVariant.Profile}
                saved={saved}
                saveDisabled={saveDisabled}
                saveError={saveError}
                onSavedChange={() => actions.onToggleSaved(id)}
                onOpen={() => actions.onOpen(id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={emptyState.title}
            description={emptyState.description}
            icon={emptyState.icon}
            action={emptyState.action}
          />
        ))}
      {!collection.loading && !collection.error && collection.pagination?.hasMore && (
        <div className={styles.collection__pagination}>
          {collection.pagination.error && (
            <Alert variant={AlertVariant.Error}>{collection.pagination.error}</Alert>
          )}
          <Button
            variant={ButtonVariant.Secondary}
            loading={collection.pagination.loading}
            onClick={collection.pagination.onLoadMore}
          >
            {collection.pagination.error ? 'Повторить загрузку' : 'Показать ещё'}
          </Button>
        </div>
      )}
    </section>
  );
}

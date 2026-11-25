import React, { useRef } from 'react';
import { useFocusAfterUpdate } from '@shared/lib/focus/use-focus-after-update';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { Spinner } from '@shared/ui/feedback/Spinner';
import type { Listing } from '@entities/listing/model';
import { ListingCardVariant } from '@entities/listing/ui/listing-card/ListingCard';
import { ListingCardWithSave } from '@features/liked-listings/ui/listing-card-with-save/ListingCardWithSave';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import { EmptyState } from '@shared/ui/feedback/EmptyState';
import { Heading, HeadingLevel, HeadingSize } from '@shared/ui/heading/Heading';
import { toProfileListing } from '../../helper';
import { getCollectionFocusTarget } from './helper';
import styles from './ProfileListingsSection.module.scss';

export interface ProfileCollection {
  items: readonly Listing[];
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
  onOpenListing: (id: string) => void;
}

export function ProfileListingsSection({
  headingId,
  title,
  collection,
  emptyState,
  onOpenListing,
}: ProfileListingsSectionProps): JSX.Element {
  const sectionRef = useRef<HTMLElement>(null);
  const requestFocus = useFocusAfterUpdate();
  return (
    <section
      ref={sectionRef}
      className={styles.collection}
      aria-labelledby={headingId}
      onFocusCapture={(event) => {
        const focusedControl = event.target as HTMLElement;
        requestFocus(() => getCollectionFocusTarget(sectionRef.current, focusedControl));
      }}
    >
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
            {collection.items.map((listing) => (
              <ListingCardWithSave
                key={listing.id}
                listing={listing}
                toListing={toProfileListing}
                variant={ListingCardVariant.Profile}
                onOpen={onOpenListing}
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

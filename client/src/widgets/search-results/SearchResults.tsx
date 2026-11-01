import React, { useRef } from 'react';
import { LuSearch } from 'react-icons/lu';
import { useFocusAfterUpdate } from '@shared/lib/focus/use-focus-after-update';
import {
  ListingCard,
  ListingCardVariant,
  type ListingCardData,
} from '../../entities/listing/ui/listing-card/ListingCard';
import { Button, ButtonVariant } from '../../shared/ui/button/Button';
import { Alert, AlertVariant } from '../../shared/ui/feedback/Alert';
import { EmptyState } from '../../shared/ui/feedback/EmptyState';
import { Skeleton } from '../../shared/ui/feedback/Skeleton';
import { formatResultCount } from './formatResultCount';
import styles from './SearchResults.module.scss';

export enum SearchResultsState {
  Ready = 'ready',
  Loading = 'loading',
  Empty = 'empty',
  Error = 'error',
}

export type SearchResultListing = {
  id: string;
  listing: ListingCardData;
  saved: boolean;
  saveDisabled?: boolean;
  saveError?: string;
};

export interface SearchResultsProps {
  listings: readonly SearchResultListing[];
  state?: SearchResultsState;
  onOpenListing: (id: string) => void;
  onSaveListing: (id: string, saved: boolean) => void;
  onResetFilters: () => void;
  onRetry: () => void;
  totalCount?: number;
  onLoadMore?: () => void;
}

export function SearchResults({
  listings,
  state = SearchResultsState.Ready,
  onOpenListing,
  onSaveListing,
  onResetFilters,
  onRetry,
  totalCount = listings.length,
  onLoadMore,
}: SearchResultsProps): JSX.Element {
  const gridRef = useRef<HTMLDivElement>(null);
  const requestFocus = useFocusAfterUpdate();
  const currentState = state === SearchResultsState.Ready && listings.length === 0
    ? SearchResultsState.Empty
    : state;
  let countLabel = formatResultCount(totalCount);
  if (currentState === SearchResultsState.Empty) {
    countLabel = formatResultCount(0);
  }
  if (currentState === SearchResultsState.Loading) {
    countLabel = 'Загрузка…';
  }
  if (currentState === SearchResultsState.Error) {
    countLabel = 'Ошибка загрузки';
  }

  return (
    <section className={styles.results} aria-labelledby="search-results-heading">
      <div className={styles.results__heading}>
        <h2 id="search-results-heading">Объявления</h2>
        <span className={styles.results__count} role="status">{countLabel}</span>
      </div>

      {listings.length > 0 && currentState !== SearchResultsState.Ready && (
        <p>Показаны предыдущие результаты поиска.</p>
      )}

      {listings.length > 0 && (
        <>
          <div ref={gridRef} className={styles.results__grid} aria-busy={currentState === SearchResultsState.Loading}>
            {listings.map(({ id, listing, saved, saveDisabled, saveError }) => (
              <ListingCard
                key={id}
                listing={listing}
                variant={ListingCardVariant.Search}
                saved={saved}
                saveDisabled={saveDisabled}
                saveError={saveError}
                onSavedChange={(nextSaved) => onSaveListing(id, nextSaved)}
                onOpen={() => onOpenListing(id)}
              />
            ))}
          </div>
          {listings.length < totalCount && onLoadMore && (
            <Button disabled={currentState !== SearchResultsState.Ready} onClick={() => {
              const addedFrom = listings.length;
              requestFocus(() => gridRef.current?.children[addedFrom]?.querySelector('button'));
              onLoadMore();
            }}>Показать ещё</Button>
          )}
        </>
      )}

      {currentState === SearchResultsState.Loading && listings.length === 0 && (
        <div className={styles.results__grid} aria-hidden="true">
          {[0, 1, 2].map((item) => (
            <div className={styles.results__skeletonCard} key={item}>
              <Skeleton height={170} />
              <Skeleton height={24} width="42%" />
              <Skeleton height={20} width="80%" />
              <Skeleton height={20} width="60%" />
            </div>
          ))}
        </div>
      )}

      {currentState === SearchResultsState.Empty && (
        <EmptyState
          title="Пока ничего не найдено"
          description="Измените фильтры или попробуйте другой район."
          icon={<LuSearch aria-hidden="true" />}
          action={(
            <Button variant={ButtonVariant.Secondary} onClick={onResetFilters}>
              Сбросить фильтры
            </Button>
          )}
        />
      )}

      {currentState === SearchResultsState.Error && (
        <div className={styles.results__error}>
          <Alert variant={AlertVariant.Error} title="Не удалось загрузить объявления">
            Проверьте соединение и попробуйте снова.
          </Alert>
          <Button variant={ButtonVariant.Secondary} onClick={onRetry}>Повторить</Button>
        </div>
      )}
    </section>
  );
}

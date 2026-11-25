import React, { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { SearchFilters } from '@features/listing-filter/ui/SearchFilters';
import { readFilters, writeFilters } from '@features/listing-filter/model/filters';
import { toSearchValues, toAppliedFilters } from '@features/listing-filter/model/searchFilterValues';
import { useSavedCollectionStatus } from '@features/liked-listings/model/use-saved-collection-status';
import { ListingCardWithSave } from '@features/liked-listings/ui/listing-card-with-save/ListingCardWithSave';
import { useTagCatalog } from '@entities/listing/model/use-tag-catalog';
import { ListingCardVariant } from '@entities/listing/ui/listing-card/ListingCard';
import { SearchResults, SearchResultsState } from '@widgets/search-results/SearchResults';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { Button } from '@shared/ui/button/Button';
import { routes } from '@shared/config/routes';
import { toSearchCard } from './helper';
import { useSearchListings } from './use-search-listings';
import styles from './SearchRoute.module.scss';

export default function SearchRoute(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const query = params.toString();
  const filters = useMemo(() => readFilters(new URLSearchParams(query)), [query]);
  const applied = useMemo(() => toSearchValues(filters), [filters]);
  const catalog = useTagCatalog();
  const { error: savedError, reload: reloadSaved } = useSavedCollectionStatus();
  const result = useSearchListings(filters, query);
  const returnTo = location.pathname + location.search;
  const openListing = useCallback(
    (id: string) => navigate(routes.listingDetails(id), { state: { searchReturnTo: returnTo } }),
    [navigate, returnTo],
  );
  let state = SearchResultsState.Ready;
  if (result.loading) {
    state = SearchResultsState.Loading;
  } else if (result.error) {
    state = SearchResultsState.Error;
  }
  return (
    <main className={styles.search__page}>
      <header className={styles.search__intro}>
        <h1>Найти жильё</h1>
        <p>Выбирайте варианты по цене, месту и условиям.</p>
      </header>
      <SearchFilters
        tagCatalog={catalog}
        applied={applied}
        onApply={(values) => setParams(writeFilters(params, toAppliedFilters(values)))}
      />
      {savedError && (
        <Alert variant={AlertVariant.Error}>
          {savedError}
          <Button onClick={reloadSaved}>Повторить загрузку избранного</Button>
        </Alert>
      )}
      <SearchResults
        state={state}
        totalCount={result.total}
        cards={result.items.map((listing) => (
          <ListingCardWithSave
            key={listing.id}
            listing={listing}
            toListing={toSearchCard}
            variant={ListingCardVariant.Search}
            onOpen={openListing}
          />
        ))}
        onRetry={result.retry}
        onResetFilters={() => setParams(writeFilters(params, readFilters(new URLSearchParams())))}
        hasMore={result.hasMore}
        loadingMore={result.loadingMore}
        loadMoreError={result.loadMoreError}
        onLoadMore={result.loadMore}
      />
    </main>
  );
}

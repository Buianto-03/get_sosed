import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { SearchFilters } from '@features/advert-filter/ui/SearchFilters';
import { readFilters, writeFilters } from '@features/advert-filter/model/filters';
import { toSearchValues, toAppliedFilters } from '@features/advert-filter/model/searchFilterValues';
import { useSavedCollectionStatus } from '@features/liked-adverts/model/use-saved-collection-status';
import { ListingCardWithSave } from '@features/liked-adverts/ui/listing-card-with-save/ListingCardWithSave';
import { useTagCatalog } from '@entities/advert/model/use-tag-catalog';
import { ListingCardVariant } from '@entities/listing/ui/listing-card/ListingCard';
import { getFilteredAdvertsThunk } from '@entities/advert/model/advertsThunk';
import { loadCards } from '@entities/advert/model/advertsSlice';
import { selectAdverts } from '@entities/advert/model/advertsSelectors';
import { SearchResults, SearchResultsState } from '@widgets/search-results/SearchResults';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { Button } from '@shared/ui/button/Button';
import { routes } from '@shared/config/routes';
import { toSearchCard } from './helper';
import styles from './SearchRoute.module.scss';

export default function SearchRoute(): JSX.Element {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const query = params.toString();
  const filters = useMemo(() => readFilters(new URLSearchParams(query)), [query]);
  const applied = useMemo(() => toSearchValues(filters), [filters]);
  const catalog = useTagCatalog();
  const { error: savedError, reload: reloadSaved } = useSavedCollectionStatus();
  const result = useAppSelector(selectAdverts);
  const request = useRef<ReturnType<ReturnType<typeof getFilteredAdvertsThunk>>>();
  const load = useCallback((): void => {
    request.current?.abort();
    const { tagIds, ...values } = filters;
    request.current = dispatch(
      getFilteredAdvertsThunk({ ...values, tags: tagIds.map((id) => ({ id, name: '' })) }),
    );
  }, [dispatch, filters]);
  useEffect(() => {
    load();
    return () => request.current?.abort();
  }, [load]);
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
        totalCount={result.adverts.length}
        cards={result.adverts.slice(0, result.visitableCards).map((advert) => (
          <ListingCardWithSave
            key={advert.id}
            advert={advert}
            toListing={toSearchCard}
            variant={ListingCardVariant.Search}
            onOpen={openListing}
          />
        ))}
        onRetry={load}
        onResetFilters={() => setParams(writeFilters(params, readFilters(new URLSearchParams())))}
        onLoadMore={() => dispatch(loadCards())}
      />
    </main>
  );
}

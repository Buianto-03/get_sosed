import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { SearchFilters } from '@features/advert-filter/ui/SearchFilters';
import { readFilters, writeFilters } from '@features/advert-filter/model/filters';
import { toSearchValues, toAppliedFilters } from '@features/advert-filter/model/searchFilterValues';
import { useSavedAdverts } from '@features/liked-adverts/model/use-saved-adverts';
import { useTagCatalog } from '@entities/advert/model/use-tag-catalog';
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
  const saved = useSavedAdverts();
  const result = useAppSelector(selectAdverts);
  const load = (): void => {
    const { tagIds, ...values } = filters;
    void dispatch(
      getFilteredAdvertsThunk({ ...values, tags: tagIds.map((id) => ({ id, name: '' })) }),
    );
  };
  useEffect(() => {
    const { tagIds, ...values } = filters;
    void dispatch(
      getFilteredAdvertsThunk({ ...values, tags: tagIds.map((id) => ({ id, name: '' })) }),
    );
  }, [dispatch, filters]);
  let state = SearchResultsState.Ready;
  if (result.loading) state = SearchResultsState.Loading;
  else if (result.error) state = SearchResultsState.Error;
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
      {saved.error && (
        <Alert variant={AlertVariant.Error}>
          {saved.error}
          <Button onClick={saved.reload}>Повторить загрузку избранного</Button>
        </Alert>
      )}
      <SearchResults
        state={state}
        totalCount={result.adverts.length}
        listings={result.adverts
          .slice(0, result.visitableCards)
          .map((advert) => ({
            id: String(advert.id),
            listing: toSearchCard(advert),
            saved: saved.savedIds.includes(advert.id),
            saveDisabled: saved.disabled || !!saved.pending[advert.id],
            saveError: saved.errors[advert.id],
          }))}
        onRetry={load}
        onResetFilters={() => setParams(writeFilters(params, readFilters(new URLSearchParams())))}
        onLoadMore={() => dispatch(loadCards())}
        onOpenListing={(id) =>
          navigate(routes.listingDetails(id), {
            state: { searchReturnTo: location.pathname + location.search },
          })
        }
        onSaveListing={(id) => {
          const advert = result.adverts.find((item) => item.id === Number(id));
          if (advert) saved.toggle(advert);
        }}
      />
    </main>
  );
}

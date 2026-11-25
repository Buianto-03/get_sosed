import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import type { AppliedFilters } from '@features/advert-filter/model/filters';
import {
  type ListingSearchState,
  getFilteredListingsThunk,
  selectListingSearch,
  selectSearchHasMore,
} from '@entities/listing/model';
import { buildSearchRequest } from './helper';

interface SearchAdvertsResult extends ListingSearchState {
  hasMore: boolean;
  retry: () => void;
  loadMore: () => void;
}

export function useSearchAdverts(filters: AppliedFilters, searchKey: string): SearchAdvertsResult {
  const dispatch = useAppDispatch();
  const result = useAppSelector(selectListingSearch);
  const hasMore = useAppSelector(selectSearchHasMore);
  const request = useRef<ReturnType<ReturnType<typeof getFilteredListingsThunk>>>();
  const start = useCallback(
    (page: number): void => {
      const pending = dispatch(
        getFilteredListingsThunk(buildSearchRequest(filters, searchKey, page)),
      );
      request.current = pending;
      void pending.then(() => {
        if (request.current === pending) {
          request.current = undefined;
        }
      });
    },
    [dispatch, filters, searchKey],
  );
  const retry = useCallback((): void => {
    request.current?.abort();
    start(1);
  }, [start]);

  useEffect(() => {
    retry();
    return () => {
      request.current?.abort();
      request.current = undefined;
    };
  }, [retry]);

  const current = result.searchKey === searchKey;
  const loadMore = (): void => {
    if (!current || !hasMore || result.loading || result.error || request.current) {
      return;
    }
    start(result.page + 1);
  };

  // A URL change renders before the effect starts its new first-page request.
  // Never expose the previous URL's cards or pagination during that render.
  const visible = current
    ? result
    : {
      ...result,
      items: [],
      total: 0,
      page: 0,
      loading: true,
      error: null,
      loadingMore: false,
      loadMoreError: null,
    };
  return { ...visible, hasMore: current && hasMore, retry, loadMore };
}

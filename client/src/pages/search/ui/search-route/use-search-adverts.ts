import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import type { AppliedFilters } from '@features/advert-filter/model/filters';
import type { AdvertSearchState } from '@entities/advert/model/advertsModel';
import { getFilteredAdvertsThunk } from '@entities/advert/model/advertsThunk';
import { selectAdvertSearch, selectSearchHasMore } from '@entities/advert/model/advertsSelectors';
import { buildSearchRequest } from './helper';

interface SearchAdvertsResult extends AdvertSearchState {
  hasMore: boolean;
  retry: () => void;
  loadMore: () => void;
}

export function useSearchAdverts(filters: AppliedFilters, searchKey: string): SearchAdvertsResult {
  const dispatch = useAppDispatch();
  const result = useAppSelector(selectAdvertSearch);
  const hasMore = useAppSelector(selectSearchHasMore);
  const request = useRef<ReturnType<ReturnType<typeof getFilteredAdvertsThunk>>>();
  const start = useCallback(
    (page: number): void => {
      const pending = dispatch(
        getFilteredAdvertsThunk(buildSearchRequest(filters, searchKey, page)),
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

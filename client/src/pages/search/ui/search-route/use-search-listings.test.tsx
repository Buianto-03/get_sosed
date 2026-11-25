import React, { StrictMode, type ReactNode } from 'react';
import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, expect, it, vi } from 'vitest';
import { listingReducer, type ListingPage, type ListingState } from '@entities/listing/model';
import { listingService } from '@entities/listing/api/listingService';
import { readFilters } from '@features/listing-filter/model/filters';
import { useSearchListings } from './use-search-listings';

interface WrapperProps {
  children: ReactNode;
}

function createSearchStore(): EnhancedStore<{ listing: ListingState }> {
  return configureStore({ reducer: { listing: listingReducer } });
}

function setup(strict = false): {
  store: ReturnType<typeof createSearchStore>;
  wrapper: (props: WrapperProps) => JSX.Element;
} {
  const store = createSearchStore();
  function wrapper({ children }: WrapperProps): JSX.Element {
    return (
      <Provider store={store}>{strict ? <StrictMode>{children}</StrictMode> : children}</Provider>
    );
  }
  return { store, wrapper };
}

const empty: ListingPage = { items: [], total: 0, page: 1, limit: 8 };
const initial = { filters: readFilters(new URLSearchParams()), searchKey: '' };

afterEach(() => {
  vi.restoreAllMocks();
});

it('cancels a pending next page on URL change and unmount, keeping the new query visible', async () => {
  const { wrapper, store } = setup();
  let resolveNext!: (value: ListingPage) => void;
  const get = vi
    .spyOn(listingService, 'getFilteredListingsPage')
    .mockResolvedValueOnce({ ...empty, total: 16 })
    .mockReturnValueOnce(
      new Promise((resolve) => {
        resolveNext = resolve;
      }),
    )
    .mockResolvedValueOnce(empty)
    .mockReturnValueOnce(
      new Promise(() => {
        /* Wait for unmount. */
      }),
    );
  const { result, rerender, unmount } = renderHook(
    ({ filters, searchKey }) => useSearchListings(filters, searchKey),
    { initialProps: initial, wrapper },
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => {
    result.current.loadMore();
    result.current.loadMore();
  });
  expect(get).toHaveBeenCalledTimes(2);
  rerender({ filters: { ...initial.filters, city: 'Казань' }, searchKey: 'city=Казань' });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(get.mock.calls[1][3]?.signal?.aborted).toBe(true);
  await act(async () => {
    resolveNext({ ...empty, total: 16, page: 2 });
  });
  expect(store.getState().listing.search).toMatchObject({ searchKey: 'city=Казань', total: 0 });
  expect(result.current.hasMore).toBe(false);
  act(() => {
    result.current.retry();
  });
  unmount();
  await waitFor(() => expect(store.getState().listing.search.requestId).toBeNull());
  expect(get.mock.calls[3][3]?.signal?.aborted).toBe(true);
  expect(store.getState().listing.search.error).toBeNull();
});

it('retries the same first page and filters after failure, including unknown tag IDs', async () => {
  const { wrapper } = setup();
  const get = vi
    .spyOn(listingService, 'getFilteredListingsPage')
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(empty);
  const filters = readFilters(new URLSearchParams('city=Казань&tags=99&priceFrom=10'));
  const { result } = renderHook(
    () => useSearchListings(filters, 'city=Казань&tags=99&priceFrom=10'),
    { wrapper },
  );
  await waitFor(() => expect(result.current.error).toBeTruthy());
  act(() => {
    result.current.retry();
  });
  await waitFor(() => expect(result.current.error).toBeNull());
  expect(get.mock.calls.map(([body, page, limit]) => ({ body, page, limit }))).toEqual(
    Array.from({ length: 2 }, () => ({
      body: {
        city: 'Казань',
        district: '',
        metro: '',
        priceFrom: 10,
        priceTo: 0,
        roomsFrom: 0,
        roomsTo: 0,
        tags: [{ id: 99, name: '' }],
      },
      page: 1,
      limit: 8,
    })),
  );
});

it('survives StrictMode cleanup and starts a live replacement first-page request', async () => {
  const { wrapper } = setup(true);
  const get = vi
    .spyOn(listingService, 'getFilteredListingsPage')
    .mockReturnValueOnce(
      new Promise(() => {
        /* StrictMode cancels the first mount. */
      }),
    )
    .mockResolvedValueOnce(empty);
  const { result } = renderHook(() => useSearchListings(initial.filters, ''), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(get).toHaveBeenCalledTimes(2);
  expect(get.mock.calls[0][3]?.signal?.aborted).toBe(true);
  expect(get.mock.calls[1][3]?.signal?.aborted).toBe(false);
});

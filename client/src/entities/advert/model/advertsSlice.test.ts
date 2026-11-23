import { describe, expect, it } from 'vitest';
import { AdvertDetailStatus, type AdvertSearchRequest } from './advertsModel';
import advertReducer from './advertsSlice';
import { getFilteredAdvertsThunk, getAdvertByIdThunk } from './advertsThunk';

describe('advertsSlice', () => {
  it('ignores older filtered advert responses', () => {
    const request: AdvertSearchRequest = {
      searchKey: '',
      page: 1,
      limit: 8,
      filters: {
        city: '',
        district: '',
        metro: '',
        priceFrom: 0,
        priceTo: 0,
        roomsFrom: 0,
        roomsTo: 0,
        tags: [],
      },
    };
    const first = advertReducer(undefined, getFilteredAdvertsThunk.pending('old', request));
    const second = advertReducer(first, getFilteredAdvertsThunk.pending('new', request));
    const stale = advertReducer(
      second,
      getFilteredAdvertsThunk.fulfilled({ items: [], total: 0, page: 1, limit: 8 }, 'old', request),
    );
    expect(stale.search.loading).toBe(true);
    expect(stale.search.requestId).toBe('new');

    const latest = advertReducer(
      stale,
      getFilteredAdvertsThunk.fulfilled({ items: [], total: 0, page: 1, limit: 8 }, 'new', request),
    );
    expect(latest.search.loading).toBe(false);
  });
});

it('keeps detail requests separate and ignores stale success and 404 after a new ID', () => {
  const first = advertReducer(undefined, getAdvertByIdThunk.pending('old', 1));
  const latest = advertReducer(first, getAdvertByIdThunk.pending('new', 2));
  const stale = advertReducer(latest, getAdvertByIdThunk.rejected(null, 'old', 1, 404));
  expect(stale.detailStatus).toBe(AdvertDetailStatus.Loading);
  expect(stale.chosenAdvert).toBeNull();
  expect(stale.search.loading).toBe(false);
  const absent = advertReducer(stale, getAdvertByIdThunk.rejected(null, 'new', 2, 404));
  expect(absent.detailStatus).toBe(AdvertDetailStatus.NotFound);
  expect(absent.search.error).toBeNull();
});

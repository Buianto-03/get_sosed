import { describe, expect, it } from 'vitest';
import { AdvertDetailStatus } from './advertsModel';
import advertReducer from './advertsSlice';
import { getFilteredAdvertsThunk, getAdvertByIdThunk } from './advertsThunk';

describe('advertsSlice', () => {
  it('ignores older filtered advert responses', () => {
    const filters = {
      city: '',
      district: '',
      metro: '',
      priceFrom: 0,
      priceTo: 0,
      roomsFrom: 0,
      roomsTo: 0,
      tags: [],
    };
    const first = advertReducer(undefined, getFilteredAdvertsThunk.pending('old', filters));
    const second = advertReducer(first, getFilteredAdvertsThunk.pending('new', filters));
    const stale = advertReducer(second, getFilteredAdvertsThunk.fulfilled([], 'old', filters));
    expect(stale.loading).toBe(true);
    expect(stale.filterRequestId).toBe('new');

    const latest = advertReducer(stale, getFilteredAdvertsThunk.fulfilled([], 'new', filters));
    expect(latest.loading).toBe(false);
  });
});

it('keeps detail requests separate and ignores stale success and 404 after a new ID', () => {
  const first = advertReducer(undefined, getAdvertByIdThunk.pending('old', 1));
  const latest = advertReducer(first, getAdvertByIdThunk.pending('new', 2));
  const stale = advertReducer(latest, getAdvertByIdThunk.rejected(null, 'old', 1, 404));
  expect(stale.detailStatus).toBe(AdvertDetailStatus.Loading);
  expect(stale.chosenAdvert).toBeNull();
  expect(stale.loading).toBe(false);
  const absent = advertReducer(stale, getAdvertByIdThunk.rejected(null, 'new', 2, 404));
  expect(absent.detailStatus).toBe(AdvertDetailStatus.NotFound);
  expect(absent.error).toBeNull();
});

import { describe, expect, it } from 'vitest';
import advertReducer from './advertsSlice';
import { getFilteredAdvertsThunk } from './advertsThunk';

describe('advertsSlice', () => {
  it('ignores older filtered advert responses', () => {
    const filters = { city: '', district: '', metro: '', priceFrom: 0, priceTo: 0, roomsFrom: 0, roomsTo: 0, tags: [] };
    const first = advertReducer(undefined, getFilteredAdvertsThunk.pending('old', filters));
    const second = advertReducer(first, getFilteredAdvertsThunk.pending('new', filters));
    const stale = advertReducer(second, getFilteredAdvertsThunk.fulfilled([], 'old', filters));
    expect(stale.loading).toBe(true);
    expect(stale.filterRequestId).toBe('new');

    const latest = advertReducer(stale, getFilteredAdvertsThunk.fulfilled([], 'new', filters));
    expect(latest.loading).toBe(false);
  });
});

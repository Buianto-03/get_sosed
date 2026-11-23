import type { AdvertSearchState, AdvertSliceT } from './advertsModel';

export const selectAdverts = (state: { advert: AdvertSliceT }): AdvertSliceT => state.advert;

export const selectAdvertSearch = (state: { advert: AdvertSliceT }): AdvertSearchState =>
  state.advert.search;

export const selectSearchHasMore = (state: { advert: AdvertSliceT }): boolean => {
  const { page, limit, total } = state.advert.search;
  return page > 0 && page * limit < total;
};

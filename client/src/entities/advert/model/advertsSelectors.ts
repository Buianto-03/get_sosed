import type { AdvertSliceT } from './advertsModel';

export const selectAdverts = (state: { advert: AdvertSliceT }): AdvertSliceT => state.advert;

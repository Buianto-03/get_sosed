export type SearchFilterValues = {
  city: string;
  priceTo: string;
  roomsFrom: string;
  district: string;
  metro: string;
  conditions: string[];
};

export const emptySearchFilters: SearchFilterValues = {
  city: '',
  priceTo: '',
  roomsFrom: '',
  district: '',
  metro: '',
  conditions: [],
};

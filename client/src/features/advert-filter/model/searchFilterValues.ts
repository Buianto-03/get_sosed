export const searchConditions = [
  'Для некурящих',
  'Питомцы разрешены',
  'Тихие вечера',
  'С рабочим местом',
] as const;

export type SearchCondition = (typeof searchConditions)[number];

export type SearchFilterValues = {
  city: string;
  priceTo: string;
  roomsFrom: string;
  district: string;
  metro: string;
  conditions: SearchCondition[];
};

export const emptySearchFilters: SearchFilterValues = {
  city: '',
  priceTo: '',
  roomsFrom: '',
  district: '',
  metro: '',
  conditions: [],
};

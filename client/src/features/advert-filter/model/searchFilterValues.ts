import type { AppliedFilters } from './filters';

export interface SearchFilterValues {
  city: string;
  priceFrom: string;
  priceTo: string;
  roomsFrom: string;
  roomsTo: string;
  district: string;
  metro: string;
  tagIds: number[];
}
export const emptySearchFilters: SearchFilterValues = {
  city: '',
  priceFrom: '',
  priceTo: '',
  roomsFrom: '',
  roomsTo: '',
  district: '',
  metro: '',
  tagIds: [],
};
export function toSearchValues(filters: AppliedFilters): SearchFilterValues {
  return {
    ...filters,
    priceFrom: String(filters.priceFrom || ''),
    priceTo: String(filters.priceTo || ''),
    roomsFrom: String(filters.roomsFrom || ''),
    roomsTo: String(filters.roomsTo || ''),
  };
}
export function toAppliedFilters(values: SearchFilterValues): AppliedFilters {
  return {
    ...values,
    priceFrom: Number(values.priceFrom) || 0,
    priceTo: Number(values.priceTo) || 0,
    roomsFrom: Number(values.roomsFrom) || 0,
    roomsTo: Number(values.roomsTo) || 0,
  };
}
export function validateSearch(values: SearchFilterValues): string {
  const numbers = [values.priceFrom, values.priceTo, values.roomsFrom, values.roomsTo];
  if (numbers.some((value) => value && (!Number.isSafeInteger(Number(value)) || Number(value) < 0)))
    return 'Введите целые неотрицательные числа.';
  if (values.priceFrom && values.priceTo && Number(values.priceFrom) > Number(values.priceTo))
    return 'Цена от не может быть больше цены до.';
  if (values.roomsFrom && values.roomsTo && Number(values.roomsFrom) > Number(values.roomsTo))
    return 'Количество комнат от не может быть больше значения до.';
  return '';
}

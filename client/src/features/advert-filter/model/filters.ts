import type { FilterType } from '../../../entities/advert/model/advert';

export type AppliedFilters = FilterType & { tagIds: number[] };

const numberParam = (params: URLSearchParams, name: string): number => {
  const value = Number(params.get(name));
  return Number.isFinite(value) && value > 0 ? value : 0;
};

export function readFilters(params: URLSearchParams): AppliedFilters {
  return {
    city: params.get('city') ?? '',
    district: params.get('district') ?? '',
    metro: params.get('metro') ?? '',
    priceFrom: numberParam(params, 'priceFrom'),
    priceTo: numberParam(params, 'priceTo'),
    roomsFrom: numberParam(params, 'roomsFrom'),
    roomsTo: numberParam(params, 'roomsTo'),
    tagIds: (params.get('tags') ?? '')
      .split(',')
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0),
  };
}

export function writeFilters(current: URLSearchParams, filters: AppliedFilters): URLSearchParams {
  const params = new URLSearchParams(current);
  const values: Record<string, string> = {
    city: filters.city.trim(),
    district: filters.district.trim(),
    metro: filters.metro.trim(),
    priceFrom: String(filters.priceFrom || ''),
    priceTo: String(filters.priceTo || ''),
    roomsFrom: String(filters.roomsFrom || ''),
    roomsTo: String(filters.roomsTo || ''),
    tags: [...new Set(filters.tagIds)].join(','),
  };
  Object.entries(values).forEach(([key, value]) => {
    if (value) params.set(key, value);
    else params.delete(key);
  });
  return params;
}

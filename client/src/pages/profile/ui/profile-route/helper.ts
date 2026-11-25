import type { Listing } from '@entities/listing/model';

export interface MyAdvertsState {
  ownerId: number | null;
  items: Listing[];
  total: number;
  page: number;
  hasMore: boolean;
  loading: boolean;
  error: string;
  loadingMore: boolean;
  loadMoreError: string;
}

export function initialMyAdverts(ownerId: number | null): MyAdvertsState {
  return {
    ownerId,
    items: [],
    total: 0,
    page: 0,
    hasMore: false,
    loading: ownerId !== null,
    error: '',
    loadingMore: false,
    loadMoreError: '',
  };
}

export function mergeAdverts(current: Listing[], incoming: Listing[]): Listing[] {
  return [...new Map([...current, ...incoming].map((advert) => [advert.id, advert])).values()];
}

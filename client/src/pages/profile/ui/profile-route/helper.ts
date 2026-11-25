import type { Listing } from '@entities/listing/model';

export interface MyListingsState {
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

export function initialMyListings(ownerId: number | null): MyListingsState {
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

export function mergeListings(current: Listing[], incoming: Listing[]): Listing[] {
  return [...new Map([...current, ...incoming].map((listing) => [listing.id, listing])).values()];
}

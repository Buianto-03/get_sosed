import { useEffect, useState } from 'react';
import { listingService } from '@entities/listing/api/listingService';
import type { ChatListingContext } from '../chat-thread/ChatThread';
import { toListingContext } from './helper';

interface ListingContextResult {
  ownerId: number;
  receiverId: number;
  listingId: number;
  listing: ChatListingContext;
}

export function useListingContext(
  ownerId: number | null,
  receiverId: number | null,
  listingId: number | null,
): ChatListingContext | undefined {
  const [result, setResult] = useState<ListingContextResult | null>(null);
  useEffect(() => {
    setResult(null);
    if (ownerId === null || receiverId === null || listingId === null) {
      return undefined;
    }
    let active = true;
    const controller = new AbortController();
    void listingService
      .getListingById(listingId, { signal: controller.signal })
      .then((advert) => {
        if (active && advert.id === listingId && advert.userId === receiverId) {
          setResult({ ownerId, receiverId, listingId, listing: toListingContext(advert) });
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
      controller.abort();
    };
  }, [ownerId, receiverId, listingId]);
  return result?.ownerId === ownerId &&
    result.receiverId === receiverId &&
    result.listingId === listingId
    ? result.listing
    : undefined;
}

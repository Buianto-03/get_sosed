import axiosInstance from '@shared/api/client';
import { listingWireFieldNames } from '@shared/api/listing-wire';
import { afterEach, expect, it, vi } from 'vitest';
import likeService from './likeService';

afterEach(() => {
  vi.restoreAllMocks();
});

it('keeps the likes URL and normalizes the existing listing ID field', async () => {
  const get = vi.spyOn(axiosInstance, 'get').mockResolvedValueOnce({
    data: [{ id: 5, userId: 2, [listingWireFieldNames.listingId]: 7 }],
  });

  await expect(likeService.getLikesByListingId(7)).resolves.toEqual([
    { id: 5, userId: 2, listingId: 7 },
  ]);
  expect(get).toHaveBeenCalledWith('/likes/7', undefined);
});

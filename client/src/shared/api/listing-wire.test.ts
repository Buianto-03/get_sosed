import { describe, expect, it } from 'vitest';
import { listingWireFieldNames, normalizeListingWireData } from './listing-wire';

describe('normalizeListingWireData', () => {
  it('normalizes listing fields and nested saved listings at the response boundary', () => {
    const data = {
      [listingWireFieldNames.listingId]: 12,
      [listingWireFieldNames.listingPhotos]: [
        { id: 4, [listingWireFieldNames.listingId]: 12, photo: '/images/photo.webp' },
      ],
      [listingWireFieldNames.savedListing]: {
        id: 12,
        [listingWireFieldNames.listingPhotos]: [],
      },
    };

    expect(normalizeListingWireData(data)).toEqual({
      listingId: 12,
      photos: [{ id: 4, listingId: 12, photo: '/images/photo.webp' }],
      listing: { id: 12, photos: [] },
    });
  });

  it('preserves arbitrary keys and input objects', () => {
    const data = { toString: 'wire value', listingId: 3 };

    expect(normalizeListingWireData(data)).toEqual(data);
    expect(data.toString).toBe('wire value');
  });
});

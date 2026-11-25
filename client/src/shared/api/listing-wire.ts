export const listingWireFieldNames = {
  listingId: 'advertId',
  listingPhotos: 'AdvertPhotos',
  savedListing: 'Advert',
} as const;

const normalizedFieldNames: Record<string, string> = {
  [listingWireFieldNames.listingId]: 'listingId',
  [listingWireFieldNames.listingPhotos]: 'photos',
  [listingWireFieldNames.savedListing]: 'listing',
};

export function normalizeListingWireData(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeListingWireData);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      Object.prototype.hasOwnProperty.call(normalizedFieldNames, key)
        ? normalizedFieldNames[key]
        : key,
      normalizeListingWireData(nestedValue),
    ]),
  );
}

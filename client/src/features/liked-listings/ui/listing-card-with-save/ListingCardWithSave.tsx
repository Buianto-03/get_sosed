import React, { memo } from 'react';
import type { Listing, ListingCardData } from '@entities/listing/model';
import {
  ListingCard,
  type ListingCardVariant,
} from '@entities/listing/ui/listing-card/ListingCard';
import { useSavedListing } from '../../model/use-saved-listing';

interface ListingCardWithSaveProps {
  listing: Listing;
  toListing: (listing: Listing) => ListingCardData;
  variant: ListingCardVariant;
  onOpen: (id: string) => void;
}

function ListingCardWithSaveView({
  listing,
  toListing,
  variant,
  onOpen,
}: ListingCardWithSaveProps): JSX.Element {
  const { saved, disabled, error, toggle } = useSavedListing(listing.id);
  return (
    <ListingCard
      listing={toListing(listing)}
      variant={variant}
      saved={saved}
      saveDisabled={disabled}
      saveError={error}
      onSavedChange={() => toggle(listing)}
      onOpen={() => onOpen(String(listing.id))}
    />
  );
}

export const ListingCardWithSave = memo(ListingCardWithSaveView);

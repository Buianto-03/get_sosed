import React, { memo } from 'react';
import type { Listing, ListingCardData } from '@entities/listing/model';
import {
  ListingCard,
  type ListingCardVariant,
} from '@entities/listing/ui/listing-card/ListingCard';
import { useSavedAdvert } from '../../model/use-saved-advert';

interface ListingCardWithSaveProps {
  advert: Listing;
  toListing: (advert: Listing) => ListingCardData;
  variant: ListingCardVariant;
  onOpen: (id: string) => void;
}

function ListingCardWithSaveView({
  advert,
  toListing,
  variant,
  onOpen,
}: ListingCardWithSaveProps): JSX.Element {
  const { saved, disabled, error, toggle } = useSavedAdvert(advert.id);
  return (
    <ListingCard
      listing={toListing(advert)}
      variant={variant}
      saved={saved}
      saveDisabled={disabled}
      saveError={error}
      onSavedChange={() => toggle(advert)}
      onOpen={() => onOpen(String(advert.id))}
    />
  );
}

export const ListingCardWithSave = memo(ListingCardWithSaveView);

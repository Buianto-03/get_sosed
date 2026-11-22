import React, { memo } from 'react';
import type { AdvertType } from '@entities/advert/model/advertsModel';
import {
  ListingCard,
  type ListingCardData,
  type ListingCardVariant,
} from '@entities/listing/ui/listing-card/ListingCard';
import { useSavedAdvert } from '../../model/use-saved-advert';

interface ListingCardWithSaveProps {
  advert: AdvertType;
  toListing: (advert: AdvertType) => ListingCardData;
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

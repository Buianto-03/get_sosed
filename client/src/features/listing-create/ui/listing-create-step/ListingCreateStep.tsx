import React from 'react';
import type { UploadAreaPhoto } from '@shared/ui/upload-area/UploadArea';
import type { ListingCreatePublishState, ListingDraft } from '../../model';
import { PhotosStep } from '../photos-step/PhotosStep';
import { PriceRulesStep } from '../price-rules-step/PriceRulesStep';
import { ReviewStep } from '../review-step/ReviewStep';
import { RoomStep } from '../room-step/RoomStep';
import styles from './ListingCreateStep.module.scss';

export interface ListingCreateStepProps {
  step: number;
  draft: ListingDraft;
  photos: UploadAreaPhoto[];
  publishState: ListingCreatePublishState;
  showRoomErrors: boolean;
  showPriceErrors: boolean;
  saved: boolean;
  onFieldChange: (field: keyof Omit<ListingDraft, 'rules'>, value: string) => void;
  onCityChange: (city: string) => void;
  onRuleChange: (rule: string, checked: boolean) => void;
  onPhotosChange: (photos: UploadAreaPhoto[]) => void;
  onSavedChange: (saved: boolean) => void;
}

export function ListingCreateStep({
  step,
  draft,
  photos,
  publishState,
  showRoomErrors,
  showPriceErrors,
  saved,
  onFieldChange,
  onCityChange,
  onRuleChange,
  onPhotosChange,
  onSavedChange,
}: ListingCreateStepProps): JSX.Element | null {
  let content: JSX.Element | null;

  switch (step) {
    case 1:
      content = (
        <RoomStep
          draft={draft}
          showErrors={showRoomErrors}
          onFieldChange={onFieldChange}
          onCityChange={onCityChange}
        />
      );
      break;
    case 2:
      content = (
        <PriceRulesStep
          draft={draft}
          showErrors={showPriceErrors}
          onFieldChange={onFieldChange}
          onRuleChange={onRuleChange}
        />
      );
      break;
    case 3:
      content = <PhotosStep photos={photos} onPhotosChange={onPhotosChange} />;
      break;
    case 4:
      content = (
        <ReviewStep
          draft={draft}
          photos={photos}
          publishState={publishState}
          saved={saved}
          onSavedChange={onSavedChange}
        />
      );
      break;
    default:
      content = null;
  }

  return <div className={styles.listing_create_step}>{content}</div>;
}

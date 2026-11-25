import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getTagCatalogView, TagCatalogState, type TagCatalog } from '@entities/listing/model';
import type { UploadAreaPhoto } from '@shared/ui/upload-area/UploadArea';
import { ListingCreateForm } from '@features/listing-create/ui/listing-create-form/ListingCreateForm';
import { PhotosStep } from '@features/listing-create/ui/photos-step/PhotosStep';
import { PriceRulesStep } from '@features/listing-create/ui/price-rules-step/PriceRulesStep';
import { ReviewStep } from '@features/listing-create/ui/review-step/ReviewStep';
import { RoomStep } from '@features/listing-create/ui/room-step/RoomStep';
import {
  ListingCreatePublishState,
  ListingCreateStep,
  validateRoom,
  validatePrice,
  type ListingDraft,
} from '@features/listing-create/model';
import { hasValidPhotos } from './helper';
import styles from './ListingCreatePage.module.scss';

export interface ListingCreatePageProps {
  tagCatalog: TagCatalog;
  initialStep?: ListingCreateStep;
  initialDraft?: Partial<ListingDraft>;
  initialPhotos?: UploadAreaPhoto[];
  initialAttemptedSteps?: ListingCreateStep[];
  initialPublishState?: ListingCreatePublishState;
  onPublish?: (draft: ListingDraft, photos: UploadAreaPhoto[]) => Promise<void> | void;
}

const emptyDraft: ListingDraft = {
  title: '',
  city: '',
  metro: '',
  area: '',
  price: '',
  description: '',
  tagIds: [],
  district: '',
  address: '',
  rooms: '',
  floor: '',
};

export function ListingCreatePage({
  tagCatalog,
  initialStep = ListingCreateStep.Room,
  initialDraft,
  initialPhotos = [],
  initialAttemptedSteps = [],
  initialPublishState = ListingCreatePublishState.Idle,
  onPublish,
}: ListingCreatePageProps): JSX.Element {
  const [draft, setDraft] = useState<ListingDraft>(() => ({ ...emptyDraft, ...initialDraft }));
  const [attemptedSteps, setAttemptedSteps] = useState(initialAttemptedSteps);
  const [photos, setPhotos] = useState<UploadAreaPhoto[]>(initialPhotos);
  const [publishState, setPublishState] = useState(initialPublishState);
  const [validationError, setValidationError] = useState('');
  const publishing = useRef(false);
  const photosRef = useRef<UploadAreaPhoto[]>(initialPhotos);

  useEffect(
    () => () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    },
    [],
  );

  const handlePhotosChange = (nextPhotos: UploadAreaPhoto[]): void => {
    const nextUrls = new Set(nextPhotos.map((photo) => photo.previewUrl));
    photosRef.current.forEach((photo) => {
      if (!nextUrls.has(photo.previewUrl)) {
        URL.revokeObjectURL(photo.previewUrl);
      }
    });
    photosRef.current = nextPhotos;
    setPhotos(nextPhotos);
  };

  const canContinue = (step: ListingCreateStep): boolean => {
    setAttemptedSteps((current) => (current.includes(step) ? current : [...current, step]));
    if (step === ListingCreateStep.Room) {
      return Object.keys(validateRoom(draft)).length === 0;
    }
    if (step === ListingCreateStep.PriceRules) {
      const { byId } = getTagCatalogView(tagCatalog.tags);
      return (
        tagCatalog.state === TagCatalogState.Ready &&
        Object.keys(validatePrice(draft)).length === 0 &&
        draft.tagIds.every((id) => byId.has(id))
      );
    }
    if (step === ListingCreateStep.Photos) {
      const valid = hasValidPhotos(photos);
      setValidationError(valid ? '' : 'Добавьте от 1 до 10 фото JPG/PNG/WebP до 10 МБ каждое.');
      return valid;
    }
    return true;
  };

  const updateDraft = (field: keyof Omit<ListingDraft, 'tagIds'>, value: string): void => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const updateRule = useCallback((rule: number, checked: boolean): void => {
    setDraft((current) => ({
      ...current,
      tagIds: checked
        ? [...new Set([...current.tagIds, rule])]
        : current.tagIds.filter((selectedRule) => selectedRule !== rule),
    }));
  }, []);

  const publishListing = async (): Promise<void> => {
    if (publishing.current || !onPublish) {
      return;
    }
    const valid = [ListingCreateStep.Room, ListingCreateStep.PriceRules, ListingCreateStep.Photos]
      .map(canContinue)
      .every(Boolean);
    if (!valid) {
      setValidationError('Проверьте все шаги: обязательные поля, числа, условия и фотографии.');
      return;
    }
    setValidationError('');
    publishing.current = true;
    setPublishState(ListingCreatePublishState.Loading);
    try {
      await onPublish(draft, photos);
      setPublishState(ListingCreatePublishState.Success);
    } catch {
      setPublishState(ListingCreatePublishState.Error);
    } finally {
      publishing.current = false;
    }
  };

  const renderStep = (step: ListingCreateStep): JSX.Element | null => {
    switch (step) {
      case ListingCreateStep.Room: {
        const { title, city, district, address, metro, area, rooms, floor } = draft;
        return (
          <RoomStep
            fields={{ title, city, district, address, metro, area, rooms, floor }}
            showErrors={attemptedSteps.includes(step)}
            onFieldChange={updateDraft}
          />
        );
      }
      case ListingCreateStep.PriceRules:
        return (
          <PriceRulesStep
            fields={{ price: draft.price, description: draft.description }}
            tagIds={draft.tagIds}
            tagCatalog={tagCatalog}
            showErrors={attemptedSteps.includes(step)}
            onFieldChange={updateDraft}
            onRuleChange={updateRule}
          />
        );
      case ListingCreateStep.Photos:
        return <PhotosStep photos={photos} onPhotosChange={handlePhotosChange} />;
      case ListingCreateStep.Review:
        return (
          <ReviewStep
            draft={draft}
            tagCatalog={tagCatalog}
            photos={photos}
            publishState={publishState}
          />
        );
      default:
        return null;
    }
  };

  return (
    <main className={styles.listing_create_page}>
      <ListingCreateForm
        validationError={validationError}
        initialStep={initialStep}
        isPublishing={publishState === ListingCreatePublishState.Loading}
        isPublished={publishState === ListingCreatePublishState.Success}
        canContinue={canContinue}
        onPublish={onPublish ? publishListing : undefined}
      >
        {renderStep}
      </ListingCreateForm>
    </main>
  );
}

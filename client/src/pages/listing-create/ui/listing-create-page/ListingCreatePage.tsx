import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import React, { useEffect, useRef, useState } from 'react';
import { TagCatalogState } from '@entities/advert/model/tag-catalog';
import type { TagCatalog } from '@entities/advert/model/tag-catalog';
import type { UploadAreaPhoto } from '@shared/ui/upload-area/UploadArea';
import { ListingCreateForm } from '@features/listing-create/ui/listing-create-form/ListingCreateForm';
import { ListingCreateStep } from '@features/listing-create/ui/listing-create-step/ListingCreateStep';
import {
  ListingCreatePublishState,
  validateRoom,
  validatePrice,
  type ListingDraft,
} from '@features/listing-create/model';
import styles from './ListingCreatePage.module.scss';

export interface ListingCreatePageProps {
  tagCatalog: TagCatalog;
  initialStep?: number;
  initialDraft?: Partial<ListingDraft>;
  initialAttemptedSteps?: number[];
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
  initialStep = 1,
  initialDraft,
  initialAttemptedSteps = [],
  initialPublishState = ListingCreatePublishState.Idle,
  onPublish,
}: ListingCreatePageProps): JSX.Element {
  const [draft, setDraft] = useState<ListingDraft>(() => ({ ...emptyDraft, ...initialDraft }));
  const [attemptedSteps, setAttemptedSteps] = useState<number[]>(initialAttemptedSteps);
  const [photos, setPhotos] = useState<UploadAreaPhoto[]>([]);
  const [publishState, setPublishState] = useState(initialPublishState);
  const [reviewSaved, setReviewSaved] = useState(false);
  const [validationError, setValidationError] = useState('');
  const publishing = useRef(false);
  const photosRef = useRef<UploadAreaPhoto[]>([]);

  useEffect(
    () => () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    },
    [],
  );

  const handlePhotosChange = (nextPhotos: UploadAreaPhoto[]): void => {
    const nextUrls = new Set(nextPhotos.map((photo) => photo.previewUrl));
    photosRef.current.forEach((photo) => {
      if (!nextUrls.has(photo.previewUrl)) URL.revokeObjectURL(photo.previewUrl);
    });
    photosRef.current = nextPhotos;
    setPhotos(nextPhotos);
  };

  const canContinue = (step: number): boolean => {
    setAttemptedSteps((current) => (current.includes(step) ? current : [...current, step]));
    if (step === 1) {
      return Object.keys(validateRoom(draft)).length === 0;
    }
    if (step === 2) {
      return (
        tagCatalog.state === TagCatalogState.Ready &&
        Object.keys(validatePrice(draft)).length === 0 &&
        draft.tagIds.every((id) => tagCatalog.tags.some((tag) => tag.id === id))
      );
    }
    if (step === 3) {
      const valid =
        photos.length >= 1 &&
        photos.length <= 10 &&
        photos.every(
          (photo) =>
            photo.file.size <= 10 * 1024 * 1024 &&
            ['image/jpeg', 'image/png', 'image/webp'].includes(photo.file.type),
        );
      setValidationError(valid ? '' : 'Добавьте от 1 до 10 фото JPG/PNG/WebP до 10 МБ каждое.');
      return valid;
    }
    return true;
  };

  const updateDraft = (field: keyof Omit<ListingDraft, 'tagIds'>, value: string): void => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const updateRule = (rule: number, checked: boolean): void => {
    setDraft((current) => ({
      ...current,
      tagIds: checked
        ? [...new Set([...current.tagIds, rule])]
        : current.tagIds.filter((selectedRule) => selectedRule !== rule),
    }));
  };

  const publishListing = async (): Promise<void> => {
    if (publishing.current || !onPublish) return;
    const valid = [1, 2, 3].map(canContinue).every(Boolean);
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

  return (
    <main className={styles.listing_create_page}>
      {validationError && <Alert variant={AlertVariant.Error}>{validationError}</Alert>}
      <ListingCreateForm
        initialStep={initialStep}
        isPublishing={publishState === ListingCreatePublishState.Loading}
        isPublished={publishState === ListingCreatePublishState.Success}
        canContinue={canContinue}
        onPublish={onPublish ? publishListing : undefined}
      >
        {(step) => (
          <ListingCreateStep
            tagCatalog={tagCatalog}
            step={step}
            draft={draft}
            photos={photos}
            publishState={publishState}
            showRoomErrors={attemptedSteps.includes(1)}
            showPriceErrors={attemptedSteps.includes(2)}
            saved={reviewSaved}
            onFieldChange={updateDraft}
            onCityChange={(city) => setDraft((current) => ({ ...current, city }))}
            onRuleChange={updateRule}
            onPhotosChange={handlePhotosChange}
            onSavedChange={setReviewSaved}
          />
        )}
      </ListingCreateForm>
    </main>
  );
}

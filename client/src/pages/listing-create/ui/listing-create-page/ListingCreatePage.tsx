import React, { useEffect, useRef, useState } from 'react';
import { TagCatalogState } from '@entities/advert/model/tag-catalog';
import type { TagCatalog } from '@entities/advert/model/tag-catalog';
import type { UploadAreaPhoto } from '@shared/ui/upload-area/UploadArea';
import { ListingCreateForm } from '@features/listing-create/ui/listing-create-form/ListingCreateForm';
import { ListingCreateStep } from '@features/listing-create/ui/listing-create-step/ListingCreateStep';
import type { ListingCreatePublishState, ListingDraft } from '@features/listing-create/model';
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
  rules: [],
};

export function ListingCreatePage({
  tagCatalog,
  initialStep = 1,
  initialDraft,
  initialAttemptedSteps = [],
  initialPublishState = 'idle',
  onPublish,
}: ListingCreatePageProps): JSX.Element {
  const [draft, setDraft] = useState<ListingDraft>(() => ({ ...emptyDraft, ...initialDraft }));
  const [attemptedSteps, setAttemptedSteps] = useState<number[]>(initialAttemptedSteps);
  const [photos, setPhotos] = useState<UploadAreaPhoto[]>([]);
  const [publishState, setPublishState] = useState(initialPublishState);
  const [reviewSaved, setReviewSaved] = useState(false);
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
      return Boolean(draft.title.trim() && draft.city && draft.metro && Number(draft.area) > 0);
    }
    if (step === 2) {
      return tagCatalog.state === TagCatalogState.Ready && Boolean(Number(draft.price) > 0 && draft.description.trim());
    }
    return true;
  };

  const updateDraft = (field: keyof Omit<ListingDraft, 'rules'>, value: string): void => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const updateRule = (rule: string, checked: boolean): void => {
    setDraft((current) => ({
      ...current,
      rules: checked
        ? [...current.rules, rule]
        : current.rules.filter((selectedRule) => selectedRule !== rule),
    }));
  };

  const publishListing = async (): Promise<void> => {
    if (publishState === 'loading' || !onPublish) return;
    setPublishState('loading');
    try {
      await onPublish(draft, photos);
      setPublishState('success');
    } catch {
      setPublishState('error');
    }
  };

  return (
    <main className={styles.listing_create_page}>
      <ListingCreateForm
        initialStep={initialStep}
        isPublishing={publishState === 'loading'}
        isPublished={publishState === 'success'}
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
            onCityChange={(city) => setDraft((current) => ({ ...current, city, metro: '' }))}
            onRuleChange={updateRule}
            onPhotosChange={handlePhotosChange}
            onSavedChange={setReviewSaved}
          />
        )}
      </ListingCreateForm>
    </main>
  );
}

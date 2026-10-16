import React from 'react';
import { ListingCard, ListingCardVariant } from '@entities/listing/ui/listing-card/ListingCard';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import type { UploadAreaPhoto } from '@shared/ui/upload-area/UploadArea';
import type { ListingCreatePublishState, ListingDraft } from '../../model';
import styles from './ReviewStep.module.scss';

export interface ReviewStepProps {
  draft: ListingDraft;
  photos: UploadAreaPhoto[];
  publishState: ListingCreatePublishState;
  saved: boolean;
  onSavedChange: (saved: boolean) => void;
}

export function ReviewStep({
  draft,
  photos,
  publishState,
  saved,
  onSavedChange,
}: ReviewStepProps): JSX.Element {
  const mainPhoto = photos.find(({ isMain }) => isMain);

  return (
    <div className={styles.review_step}>
      <h2>Проверьте объявление</h2>
      <ListingCard
        listing={{
          title: draft.title || 'Новое объявление',
          price: Number(draft.price) || 0,
          imageUrl: mainPhoto?.previewUrl,
          imageAlt: mainPhoto?.file.name ?? 'Главное фото объявления',
          city: draft.city,
          metro: draft.metro ? `м. ${draft.metro}` : '',
          tags: draft.rules,
        }}
        variant={ListingCardVariant.Profile}
        saved={saved}
        onSavedChange={onSavedChange}
        onOpen={() => undefined}
      />
      <dl className={styles.review_step__details}>
        <div>
          <dt>Площадь комнаты</dt>
          <dd>{draft.area ? `${draft.area} м²` : 'Не указана'}</dd>
        </div>
        <div>
          <dt>Фотографии</dt>
          <dd>{photos.length}</dd>
        </div>
        <div>
          <dt>Описание</dt>
          <dd>{draft.description || 'Не добавлено'}</dd>
        </div>
      </dl>
      {publishState === 'error' && (
        <Alert variant={AlertVariant.Error} title="Не удалось опубликовать объявление">
          Проверьте данные и попробуйте ещё раз.
        </Alert>
      )}
      {publishState === 'success' && (
        <Alert variant={AlertVariant.Success} title="Объявление опубликовано в preview">
          Это локальный preview: данные не отправлялись на сервер.
        </Alert>
      )}
      {publishState === 'idle' && <p>Публикация в preview не отправляет данные на сервер.</p>}
    </div>
  );
}

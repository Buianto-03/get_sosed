import React from 'react';
import type { TagCatalog } from '@entities/advert/model/tag-catalog';
import { ListingCard, ListingCardVariant } from '@entities/listing/ui/listing-card/ListingCard';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import type { UploadAreaPhoto } from '@shared/ui/upload-area/UploadArea';
import { ListingCreatePublishState, type ListingDraft } from '../../model';
import styles from './ReviewStep.module.scss';

export interface ReviewStepProps {
  draft: ListingDraft;
  tagCatalog: TagCatalog;
  photos: UploadAreaPhoto[];
  publishState: ListingCreatePublishState;
  saved: boolean;
  onSavedChange: (saved: boolean) => void;
}

export function ReviewStep({
  draft,
  tagCatalog,
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
          tags: draft.tagIds.map(
            (id) => tagCatalog.tags.find((tag) => tag.id === id)?.name ?? `#${id}`,
          ),
        }}
        variant={ListingCardVariant.Profile}
        saved={saved}
        saveDisabled
        onSavedChange={onSavedChange}
        onOpen={() => undefined}
      />
      <dl className={styles.review_step__details}>
        <div>
          <dt>Адрес</dt>
          <dd>
            {[draft.city, draft.district, draft.address, draft.metro].filter(Boolean).join(', ')}
          </dd>
        </div>
        <div>
          <dt>Комнаты</dt>
          <dd>{draft.rooms}</dd>
        </div>
        <div>
          <dt>Этаж</dt>
          <dd>{draft.floor}</dd>
        </div>
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
      {publishState === ListingCreatePublishState.Error && (
        <Alert variant={AlertVariant.Error} title="Не удалось опубликовать объявление">
          Проверьте данные и попробуйте ещё раз.
        </Alert>
      )}
      {publishState === ListingCreatePublishState.Success && (
        <Alert variant={AlertVariant.Success} title="Объявление опубликовано">
          Объявление доступно на сайте.
        </Alert>
      )}
      {publishState === ListingCreatePublishState.Idle && (
        <p>Проверьте сведения перед публикацией.</p>
      )}
    </div>
  );
}

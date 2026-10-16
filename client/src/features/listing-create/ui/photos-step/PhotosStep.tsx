import React from 'react';
import { UploadArea, type UploadAreaPhoto } from '@shared/ui/upload-area/UploadArea';
import styles from './PhotosStep.module.scss';

export interface PhotosStepProps {
  photos: UploadAreaPhoto[];
  onPhotosChange: (photos: UploadAreaPhoto[]) => void;
}

export function PhotosStep({ photos, onPhotosChange }: PhotosStepProps): JSX.Element {
  return (
    <div className={styles.photos_step}>
      <h2>Добавьте фотографии</h2>
      <p>Выберите фото комнаты и отметьте главное для карточки объявления.</p>
      <UploadArea
        id="listing-photos"
        label="Фотографии комнаты"
        maxFiles={8}
        maxFileSizeMb={5}
        value={photos}
        onChange={onPhotosChange}
      />
    </div>
  );
}

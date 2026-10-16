import React, { useEffect, useRef, useState } from 'react';
import { LuImage, LuStar, LuTrash2 } from 'react-icons/lu';
import { ButtonSize } from '../button/Button';
import { IconButton } from '../button/IconButton';
import { FilePicker, FilePickerAccept } from '../file-picker/FilePicker';
import styles from './UploadArea.module.scss';

export interface UploadAreaPhoto {
  id: string;
  file: File;
  previewUrl: string;
  isMain: boolean;
}

export interface UploadAreaProps {
  id: string;
  label: string;
  maxFiles?: number;
  maxFileSizeMb?: number;
  accept?: FilePickerAccept[];
  className?: string;
  value?: UploadAreaPhoto[];
  onChange?: (photos: UploadAreaPhoto[]) => void;
}

function makePhotoId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`;
}

function isAcceptedFile(file: File, accept: FilePickerAccept[]): boolean {
  return accept.some((type) =>
    type === FilePickerAccept.Images ? file.type.startsWith('image/') : file.type === String(type),
  );
}

export function UploadArea({
  id,
  label,
  maxFiles = 8,
  maxFileSizeMb = 10,
  accept = [FilePickerAccept.Images],
  className,
  value,
  onChange,
}: UploadAreaProps): JSX.Element {
  const [uncontrolledPhotos, setUncontrolledPhotos] = useState<UploadAreaPhoto[]>([]);
  const photos = value ?? uncontrolledPhotos;
  const isControlled = value !== undefined;
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const photosRef = useRef<UploadAreaPhoto[]>(uncontrolledPhotos);
  photosRef.current = uncontrolledPhotos;

  useEffect(
    () => () => {
      if (!isControlled) {
        photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
      }
    },
    [isControlled],
  );

  const updatePhotos = (nextPhotos: UploadAreaPhoto[]): void => {
    if (!isControlled) setUncontrolledPhotos(nextPhotos);
    onChange?.(nextPhotos);
  };

  const addFiles = (files: File[]): void => {
    const accepted: File[] = [];
    const errors: string[] = [];
    let availableSlots = maxFiles - photos.length;

    files.forEach((file) => {
      if (!isAcceptedFile(file, accept)) {
        errors.push(`«${file.name}»: неподдерживаемый формат.`);
      } else if (file.size > maxFileSizeMb * 1024 * 1024) {
        errors.push(`«${file.name}»: размер больше ${maxFileSizeMb} МБ.`);
      } else if (availableSlots <= 0) {
        errors.push(`Можно добавить не больше ${maxFiles} фото.`);
      } else {
        accepted.push(file);
        availableSlots -= 1;
      }
    });

    const mainPhotoId = photos.find((photo) => photo.isMain)?.id;
    const newPhotos = accepted.map((file) => ({
      id: makePhotoId(file),
      file,
      previewUrl: URL.createObjectURL(file),
      isMain: false,
    }));
    const nextMainPhotoId = mainPhotoId ?? newPhotos[0]?.id;
    updatePhotos(
      [...photos, ...newPhotos].map((photo) => ({
        ...photo,
        isMain: photo.id === nextMainPhotoId,
      })),
    );
    setError(errors.join(' '));
  };

  const removePhoto = (photo: UploadAreaPhoto): void => {
    if (!isControlled) URL.revokeObjectURL(photo.previewUrl);
    const nextPhotos = photos.filter((item) => item.id !== photo.id);
    const nextMainPhotoId = photo.isMain
      ? nextPhotos[0]?.id
      : nextPhotos.find((item) => item.isMain)?.id;
    updatePhotos(
      nextPhotos.map((item) => ({
        ...item,
        isMain: item.id === nextMainPhotoId,
      })),
    );
  };

  const selectMainPhoto = (photoId: string): void => {
    updatePhotos(photos.map((photo) => ({ ...photo, isMain: photo.id === photoId })));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <section className={[styles.root, className].filter(Boolean).join(' ')} aria-label={label}>
      <div
        className={[styles.dropzone, dragging && styles.dragging].filter(Boolean).join(' ')}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={handleDrop}
      >
        <LuImage className={styles.dropIcon} aria-hidden="true" />
        <strong>{label}</strong>
        <span className={styles.hint}>Перетащите фото сюда или выберите на устройстве</span>
        <FilePicker
          id={`${id}-input`}
          label="Выбрать фото"
          onFilesSelected={addFiles}
          accept={accept}
          multiple
        />
        <span className={styles.limits}>
          До {maxFiles} фото · не более {maxFileSizeMb} МБ каждое
        </span>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {photos.length > 0 ? (
        <ul className={styles.photoGrid} aria-label="Выбранные фотографии">
          {photos.map((photo) => {
            const { isMain } = photo;
            return (
              <li key={photo.id} className={styles.photo}>
                <img className={styles.thumbnail} src={photo.previewUrl} alt="" />
                {isMain && (
                  <span className={styles.mainBadge}>
                    <LuStar aria-hidden="true" />
                    Главное фото
                  </span>
                )}
                <span className={styles.fileName} title={photo.file.name}>
                  {photo.file.name}
                </span>
                <div className={styles.photoActions}>
                  <IconButton
                    className={isMain ? styles.mainAction : undefined}
                    size={ButtonSize.Lg}
                    aria-pressed={isMain}
                    label={
                      isMain
                        ? `Главное фото: ${photo.file.name}`
                        : `Сделать главным фото: ${photo.file.name}`
                    }
                    icon={<LuStar aria-hidden="true" />}
                    onClick={() => selectMainPhoto(photo.id)}
                  />
                  <IconButton
                    size={ButtonSize.Lg}
                    label={`Удалить фото: ${photo.file.name}`}
                    icon={<LuTrash2 aria-hidden="true" />}
                    onClick={() => removePhoto(photo)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.empty}>Фотографии пока не выбраны</p>
      )}
    </section>
  );
}

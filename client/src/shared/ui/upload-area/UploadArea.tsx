import React, { useEffect, useRef, useState } from 'react';
import { LuImage, LuStar, LuTrash2 } from 'react-icons/lu';
import { FilePicker, FilePickerAccept } from '../file-picker/FilePicker';
import styles from './UploadArea.module.scss';

type PhotoItem = {
  id: string;
  file: File;
  previewUrl: string;
};

export type UploadAreaProps = {
  id: string;
  label: string;
  maxFiles?: number;
  maxFileSizeMb?: number;
  accept?: FilePickerAccept[];
  className?: string;
};

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
}: UploadAreaProps): JSX.Element {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [mainPhotoId, setMainPhotoId] = useState<string>();
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const photosRef = useRef<PhotoItem[]>(photos);
  photosRef.current = photos;

  useEffect(
    () => () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    },
    [],
  );

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

    const newPhotos = accepted.map((file) => ({
      id: makePhotoId(file),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    const nextPhotos = [...photos, ...newPhotos];
    setPhotos(nextPhotos);
    if (!mainPhotoId && newPhotos[0]) setMainPhotoId(newPhotos[0].id);
    setError(errors.join(' '));
  };

  const removePhoto = (photo: PhotoItem): void => {
    URL.revokeObjectURL(photo.previewUrl);
    const nextPhotos = photos.filter((item) => item.id !== photo.id);
    setPhotos(nextPhotos);
    if (mainPhotoId === photo.id) setMainPhotoId(nextPhotos[0]?.id);
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
            const isMain = mainPhotoId === photo.id;
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
                  <button
                    className={styles.action}
                    type="button"
                    aria-pressed={isMain}
                    aria-label={
                      isMain
                        ? `Главное фото: ${photo.file.name}`
                        : `Сделать главным фото: ${photo.file.name}`
                    }
                    onClick={() => setMainPhotoId(photo.id)}
                  >
                    <LuStar aria-hidden="true" />
                  </button>
                  <button
                    className={styles.action}
                    type="button"
                    aria-label={`Удалить фото: ${photo.file.name}`}
                    onClick={() => removePhoto(photo)}
                  >
                    <LuTrash2 aria-hidden="true" />
                  </button>
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

import type { UploadAreaPhoto } from '@shared/ui/upload-area/UploadArea';

export function hasValidPhotos(photos: readonly UploadAreaPhoto[]): boolean {
  return (
    photos.length >= 1 &&
    photos.length <= 10 &&
    photos.every(
      ({ file }) =>
        file.size <= 10 * 1024 * 1024 &&
        ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
    )
  );
}

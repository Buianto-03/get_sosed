import type { ListingDraft } from '@features/listing-create/model';
import type { UploadAreaPhoto } from '@shared/ui/upload-area/UploadArea';

export function publicationData(
  draft: ListingDraft,
  photos: UploadAreaPhoto[],
  coordinates?: string,
): FormData {
  const data = new FormData();
  (['title', 'city', 'district', 'address', 'metro', 'rooms', 'floor', 'price'] as const).forEach(
    (field) => data.set(field, draft[field]),
  );
  data.set('body', draft.description);
  data.set('square', draft.area);
  data.set('tagIds', JSON.stringify(draft.tagIds));
  if (coordinates) data.set('coordinates', coordinates);
  [...photos.filter((photo) => photo.isMain), ...photos.filter((photo) => !photo.isMain)].forEach(
    (photo) => data.append('files', photo.file),
  );
  return data;
}

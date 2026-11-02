export function getPhotoRemovalFocusTarget(
  root: HTMLElement | null,
  removedPhotoId: string,
  nextPhotoId: string | undefined,
): HTMLButtonElement | null | undefined {
  const photos = Array.from(root?.querySelectorAll<HTMLElement>('[data-photo-id]') ?? []);
  if (photos.some((element) => element.dataset.photoId === removedPhotoId)) {
    return null;
  }

  const target = photos.find((element) => element.dataset.photoId === nextPhotoId);
  return target?.querySelector('button') ?? root?.querySelector('button');
}

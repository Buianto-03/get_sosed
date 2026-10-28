export interface CarouselState {
  sourceKey: string;
  activeIndex: number;
  loadedIndices: number[];
  failedSources: string[];
}

export function normalizePhotos(photos: readonly string[]): string[] {
  return [...new Set(photos.map((photo) => photo.trim()).filter(Boolean))];
}

export function createCarouselState(sourceKey: string): CarouselState {
  return { sourceKey, activeIndex: 0, loadedIndices: [0, 1], failedSources: [] };
}

export function moveToSlide(state: CarouselState, index: number, count: number): CarouselState {
  const activeIndex = Math.max(0, Math.min(index, count - 1));
  return {
    ...state,
    activeIndex,
    loadedIndices: [...new Set([
      ...state.loadedIndices,
      activeIndex - 1,
      activeIndex,
      activeIndex + 1,
    ])],
  };
}

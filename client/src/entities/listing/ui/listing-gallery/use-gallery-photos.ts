import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { ListingPhoto } from './ListingGallery';

// Source gating also covers hidden desktop tiles and Chrome's eager reload of lazy images.
export function useGalleryPhotos(
  galleryRef: RefObject<HTMLDivElement>,
  photos: readonly ListingPhoto[],
): ReadonlySet<string> {
  const [loadedSources, setLoadedSources] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const sources = entries
          .filter(
            (entry) =>
              entry.isIntersecting &&
              entry.intersectionRect.width > 0 &&
              entry.intersectionRect.height > 0,
          )
          .map((entry) => entry.target.getAttribute('data-photo-src'))
          .filter((src): src is string => src !== null);
        setLoadedSources((previous) => {
          if (sources.every((src) => previous.has(src))) {
            return previous;
          }
          return new Set([...previous, ...sources]);
        });
      },
      { root: gallery },
    );
    Array.from(gallery.children).forEach((tile) => observer.observe(tile));
    return () => observer.disconnect();
  }, [galleryRef, photos]);

  return loadedSources;
}

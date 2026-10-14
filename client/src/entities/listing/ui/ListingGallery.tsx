import React, { useRef, useState } from 'react';
import { LuChevronLeft, LuChevronRight, LuImageOff } from 'react-icons/lu';
import { IconButton } from '@shared/ui/button/IconButton';
import { Modal, ModalSize } from '@shared/ui/overlay/Modal';
import styles from './ListingGallery.module.scss';

export type ListingPhoto = {
  id: string;
  src: string;
  alt: string;
};

export type ListingGalleryProps = {
  photos: readonly ListingPhoto[];
};

export function ListingGallery({ photos }: ListingGalleryProps): JSX.Element {
  const galleryRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const changeIndex = (nextIndex: number): void => {
    const normalizedIndex = (nextIndex + photos.length) % photos.length;
    setActiveIndex(normalizedIndex);
    galleryRef.current?.children[normalizedIndex]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start',
    });
  };

  const handleScroll = (): void => {
    const gallery = galleryRef.current;
    if (!gallery || gallery.clientWidth === 0) return;
    setActiveIndex(Math.round(gallery.scrollLeft / gallery.clientWidth));
  };

  let layout = styles.multiple;
  if (photos.length === 1) layout = styles.single;
  if (photos.length === 2) layout = styles.double;

  if (photos.length === 0) {
    return (
      <div className={[styles.gallery, styles.empty].join(' ')} aria-label="Фотографии жилья">
        <LuImageOff aria-hidden="true" />
        <span>Фотографии не добавлены</span>
      </div>
    );
  }

  return (
    <>
      <section className={[styles.gallery, layout].join(' ')} aria-label="Фотографии жилья">
        <div className={styles.track} ref={galleryRef} onScroll={handleScroll}>
          {photos.map((photo, index) => (
            <button
              className={[styles.photo, index === 0 && styles.primary].filter(Boolean).join(' ')}
              key={photo.id}
              type="button"
              aria-label={`Открыть фото ${index + 1} из ${photos.length}`}
              onClick={() => {
                setActiveIndex(index);
                setLightboxOpen(true);
              }}
            >
              <img src={photo.src} alt={photo.alt} />
              {photos.length > 3 && index === 2 && (
                <span className={styles.morePhotos}>Ещё {photos.length - 3} фото</span>
              )}
            </button>
          ))}
        </div>
        {photos.length > 1 && (
          <div className={styles.controls} aria-label="Перелистывание фотографий">
            <IconButton
              className={styles.control}
              icon={<LuChevronLeft aria-hidden="true" />}
              label="Предыдущее фото"
              onClick={() => changeIndex(activeIndex - 1)}
            />
            <span aria-live="polite">
              {activeIndex + 1} / {photos.length}
            </span>
            <IconButton
              className={styles.control}
              icon={<LuChevronRight aria-hidden="true" />}
              label="Следующее фото"
              onClick={() => changeIndex(activeIndex + 1)}
            />
          </div>
        )}
      </section>
      <Modal
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={`Фото ${activeIndex + 1} из ${photos.length}`}
        size={ModalSize.Lg}
        closeLabel="Закрыть просмотр фото"
        className={styles.lightbox}
      >
        <div className={styles.lightboxContent}>
          <img src={photos[activeIndex].src} alt={photos[activeIndex].alt} />
          {photos.length > 1 && (
            <div className={styles.lightboxControls}>
              <IconButton
                icon={<LuChevronLeft aria-hidden="true" />}
                label="Предыдущее фото"
                onClick={() => changeIndex(activeIndex - 1)}
              />
              <IconButton
                icon={<LuChevronRight aria-hidden="true" />}
                label="Следующее фото"
                onClick={() => changeIndex(activeIndex + 1)}
              />
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

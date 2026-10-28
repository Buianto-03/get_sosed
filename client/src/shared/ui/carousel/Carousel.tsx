import React, { useState } from 'react';
import { LuChevronLeft, LuChevronRight, LuImageOff } from 'react-icons/lu';
import { createCarouselState, moveToSlide, normalizePhotos } from './helper';
import styles from './Carousel.module.scss';

export interface CarouselProps {
  photos: readonly string[];
  label?: string;
  imageAlt?: string;
  className?: string;
  onOpen?: () => void;
  openLabel?: string;
}

export function Carousel({
  photos,
  label = 'Фотографии объявления',
  imageAlt = 'Фото объявления',
  className,
  onOpen,
  openLabel,
}: CarouselProps): JSX.Element {
  const sources = normalizePhotos(photos);
  const sourceKey = JSON.stringify(sources);
  const [state, setState] = useState(() => createCarouselState(sourceKey));

  // Reset before rendering a different collection, without a stale frame or an effect.
  if (state.sourceKey !== sourceKey) {
    setState(createCarouselState(sourceKey));
  }

  const current = state.sourceKey === sourceKey ? state : createCarouselState(sourceKey);
  const hasControls = sources.length > 1;
  const goTo = (index: number): void => {
    setState((previous) => moveToSlide(previous, index, sources.length));
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (!hasControls || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (event.key === 'Home') {
      goTo(0);
    } else if (event.key === 'End') {
      goTo(sources.length - 1);
    } else {
      goTo(current.activeIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  };

  return (
    <section
      className={[styles.carousel, className].filter(Boolean).join(' ')}
      aria-label={label}
      aria-roledescription="карусель"
    >
      <div className={styles.carousel__viewport}>
        {sources.length === 0 ? (
          <div className={styles.carousel__placeholder}>
            <LuImageOff aria-hidden="true" />
            <span>Фото не добавлено</span>
          </div>
        ) : (
          <div
            className={styles.carousel__track}
            style={{ transform: `translateX(-${current.activeIndex * 100}%)` }}
          >
            {sources.map((src, index) => (
              <div
                className={styles.carousel__slide}
                key={src}
                aria-hidden={index !== current.activeIndex}
              >
                {current.failedSources.includes(src) ? (
                  <div className={styles.carousel__placeholder}>
                    <LuImageOff aria-hidden="true" />
                    <span>Не удалось загрузить фото</span>
                  </div>
                ) : current.loadedIndices.includes(index) && (
                  <img
                    className={styles.carousel__image}
                    src={src}
                    alt={`${imageAlt} ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    onError={() => {
                      setState((previous) => ({
                        ...previous,
                        failedSources: [...previous.failedSources, src],
                      }));
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
        {onOpen && (
          <button
            className={styles.carousel__open}
            type="button"
            aria-label={openLabel ?? `Открыть объявление: ${imageAlt}`}
            onKeyDown={handleKeyDown}
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
          />
        )}
      </div>
      {hasControls && (
        <div className={styles.carousel__controls}>
          <button
            className={styles.carousel__arrow}
            type="button"
            aria-label="Предыдущее фото"
            aria-disabled={current.activeIndex === 0}
            onKeyDown={handleKeyDown}
            onClick={(event) => {
              event.stopPropagation();
              goTo(current.activeIndex - 1);
            }}
          >
            <LuChevronLeft aria-hidden="true" />
          </button>
          <span className={styles.carousel__counter} aria-live="polite" aria-atomic="true">
            {current.activeIndex + 1} / {sources.length}
          </span>
          <button
            className={styles.carousel__arrow}
            type="button"
            aria-label="Следующее фото"
            aria-disabled={current.activeIndex === sources.length - 1}
            onKeyDown={handleKeyDown}
            onClick={(event) => {
              event.stopPropagation();
              goTo(current.activeIndex + 1);
            }}
          >
            <LuChevronRight aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}

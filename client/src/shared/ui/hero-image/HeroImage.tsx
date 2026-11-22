/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import styles from './HeroImage.module.scss';

interface HeroImageProps {
  className?: string;
}

// Matches SiteContent's padding, 1440px maximum width and the banners' 45% media column.
// At a content width of 760px the banners switch to a full-width image.
const sizes = [
  '(max-width: 680px) calc(100vw - 32px)',
  '(max-width: 808px) calc(100vw - 48px)',
  '(max-width: 1100px) calc(45vw - 21.6px)',
  '(max-width: 1440px) calc(45vw - 25.2px)',
  '622.8px',
].join(', ');

// React 18.2 forwards the lowercase browser attribute without an unknown-prop warning.
const imagePriority = { fetchpriority: 'high' };

export function HeroImage({ className }: HeroImageProps): JSX.Element {
  return (
    <picture className={styles.hero_image}>
      <source
        type="image/avif"
        srcSet="/redesign-hero-480.avif 480w, /redesign-hero-768.avif 768w, /redesign-hero-1280.avif 1280w"
        sizes={sizes}
      />
      <source
        type="image/webp"
        srcSet="/redesign-hero-480.webp 480w, /redesign-hero-768.webp 768w, /redesign-hero-1280.webp 1280w"
        sizes={sizes}
      />
      <img
        className={className}
        src="/redesign-hero.jpg"
        alt="Интерьер квартиры"
        width={1280}
        height={960}
        loading="eager"
        {...imagePriority}
        decoding="async"
      />
    </picture>
  );
}

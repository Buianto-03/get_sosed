import React from 'react';
import { Button } from '@shared/ui/button/Button';
import { Heading, HeadingLevel, HeadingSize } from '@shared/ui/heading/Heading';
import styles from './AboutBanner.module.scss';

interface AboutBannerProps {
  description: string;
  onBrowseListings: () => void;
}

export function AboutBanner({ description, onBrowseListings }: AboutBannerProps): JSX.Element {
  return (
    <div className={styles.aboutBanner}>
      <section className={styles.aboutBanner__content} aria-label="О сервисе">
        <div className={styles.aboutBanner__copy}>
          <p className={styles.aboutBanner__eyebrow}>О сервисе</p>
          <Heading
            className={styles.aboutBanner__title}
            level={HeadingLevel.H1}
            size={HeadingSize.Display}
          >
            Комфортный дом начинается с людей
          </Heading>
          <p className={styles.aboutBanner__description}>{description}</p>
          <Button className={styles.aboutBanner__button} onClick={onBrowseListings}>
            Смотреть объявления
          </Button>
        </div>
        <div className={styles.aboutBanner__media}>
          <img className={styles.aboutBanner__photo} src="/redesign-hero.jpg" alt="Интерьер квартиры" />
        </div>
      </section>
    </div>
  );
}

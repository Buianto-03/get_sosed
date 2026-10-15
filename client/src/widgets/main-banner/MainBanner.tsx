import React from 'react';
import { Button, ButtonVariant } from '../../shared/ui/button/Button';
import styles from './MainBanner.module.scss';

export type MainBannerProps = {
  onFindHousing: () => void;
  onCreateListing: () => void;
  description?: string;
};

export function MainBanner({
  onFindHousing,
  onCreateListing,
  description = 'Ищи жильё для совместного проживания и знакомься с будущими соседями.',
}: MainBannerProps): JSX.Element {
  return (
    <div className={styles.container}>
      <section className={styles.banner} aria-labelledby="main-banner-title">
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Жильё и люди рядом</p>
          <h2 id="main-banner-title">Твоё место. Твои люди.</h2>
          <p className={styles.description}>{description}</p>
          <div className={styles.actions}>
            <Button onClick={onFindHousing}>Найти жильё</Button>
            <Button variant={ButtonVariant.Secondary} onClick={onCreateListing}>
              Разместить объявление
            </Button>
          </div>
        </div>
        <img className={styles.photo} src="/mainPhoto.jpg" alt="Гостиная в квартире" />
      </section>
    </div>
  );
}

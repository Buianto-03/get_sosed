import React from 'react';
import { CreateListingButton } from '@features/listing-create/ui/create-listing-button/CreateListingButton';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import styles from './MainBanner.module.scss';

export interface MainBannerProps {
  onFindHousing: () => void;
  description?: string;
}

export function MainBanner({
  onFindHousing,
  description = 'Ищи жильё для совместного проживания и знакомься с будущими соседями.',
}: MainBannerProps): JSX.Element {
  return (
    <div className={styles.main_banner}>
      <section className={styles.main_banner__content} aria-labelledby="main-banner-title">
        <div className={styles.main_banner__copy}>
          <p className={styles.main_banner__eyebrow}>Жильё и люди рядом</p>
          <h1 id="main-banner-title">
            Твоё место.
            <br />
            Твои люди.
          </h1>
          <p className={styles.main_banner__description}>{description}</p>
          <div className={styles.main_banner__actions}>
            <Button onClick={onFindHousing}>Найти жильё</Button>
            <CreateListingButton variant={ButtonVariant.Secondary} />
          </div>
        </div>
        <div className={styles.main_banner__media}>
          <img className={styles.main_banner__photo} src="/redesign-hero.jpg" alt="Интерьер квартиры" />
        </div>
      </section>
    </div>
  );
}

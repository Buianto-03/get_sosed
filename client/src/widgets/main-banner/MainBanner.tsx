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
    <div className={styles.container}>
      <section className={styles.banner} aria-labelledby="main-banner-title">
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Жильё и люди рядом</p>
          <h2 id="main-banner-title">Твоё место. Твои люди.</h2>
          <p className={styles.description}>{description}</p>
          <div className={styles.actions}>
            <Button onClick={onFindHousing}>Найти жильё</Button>
            <CreateListingButton variant={ButtonVariant.Secondary} />
          </div>
        </div>
        <img className={styles.photo} src="/mainPhoto.jpg" alt="Гостиная в квартире" />
      </section>
    </div>
  );
}

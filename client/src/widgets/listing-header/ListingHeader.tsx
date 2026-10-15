import React from 'react';
import { LuArrowLeft } from 'react-icons/lu';
import { ListingGallery, type ListingPhoto } from '../../entities/listing/ui/ListingGallery';
import { Button, ButtonSize, ButtonVariant } from '../../shared/ui/button/Button';
import { Heading, HeadingLevel, HeadingSize } from '../../shared/ui/heading/Heading';
import styles from './ListingHeader.module.scss';

export type ListingHeaderProps = {
  title: string;
  photos: readonly ListingPhoto[];
  onBack: () => void;
};

export function ListingHeader({ title, photos, onBack }: ListingHeaderProps): JSX.Element {
  return (
    <div className={styles.listingHeader}>
      <Button
        className={styles.listingHeader__back}
        variant={ButtonVariant.Text}
        size={ButtonSize.Sm}
        onClick={onBack}
      >
        <LuArrowLeft aria-hidden="true" />
        К результатам
      </Button>
      <Heading
        className={styles.listingHeader__title}
        level={HeadingLevel.H2}
        size={HeadingSize.Xl}
      >
        {title}
      </Heading>
      <ListingGallery photos={photos} />
    </div>
  );
}

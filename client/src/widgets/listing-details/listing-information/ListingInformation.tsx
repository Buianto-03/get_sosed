/* eslint-disable @typescript-eslint/consistent-type-definitions */
import React from 'react';
import { LuBedDouble, LuMapPin, LuRuler, LuLayers } from 'react-icons/lu';
import { Chip, ChipSize } from '@shared/ui/chip/Chip';
import { Surface, SurfaceElement } from '@shared/ui/surface/Surface';
import styles from './ListingInformation.module.scss';

export interface ListingInformationData {
  rooms?: number;
  area?: number;
  floor?: number;
  description: string;
  tags: readonly string[];
  location: {
    city?: string;
    district?: string;
    metro?: string;
  };
}

interface ListingInformationProps {
  information: ListingInformationData;
}

export function ListingInformation({ information }: ListingInformationProps): JSX.Element {
  const { rooms, area, floor, description, tags, location } = information;
  const place = [location.city, location.district].filter(Boolean).join(', ');
  const address = [place, location.metro].filter(Boolean).join(' · ');

  return (
    <div className={styles.listingInformation}>
      <Surface as={SurfaceElement.Section} className={styles.listingInformation__panel}>
        <h2 className={styles.listingInformation__heading}>О жилье</h2>
        {(rooms !== undefined || area !== undefined || floor !== undefined) && (
          <div className={styles.listingInformation__facts} aria-label="Характеристики жилья">
            {rooms !== undefined && <span><LuBedDouble aria-hidden="true" />{rooms} комн.</span>}
            {area !== undefined && <span><LuRuler aria-hidden="true" />{area} м²</span>}
            {floor !== undefined && <span><LuLayers aria-hidden="true" />{floor} этаж</span>}
          </div>
        )}
        <p className={styles.listingInformation__description}>{description}</p>
        {tags.length > 0 && (
          <div className={styles.listingInformation__tags} aria-label="Особенности жилья">
            {tags.map((tag) => <Chip key={tag} label={tag} size={ChipSize.Sm} />)}
          </div>
        )}
      </Surface>
      <Surface as={SurfaceElement.Section} className={styles.listingInformation__panel}>
        <h2 className={styles.listingInformation__heading}>Расположение</h2>
        {address && <p className={styles.listingInformation__address}><LuMapPin aria-hidden="true" />{address}</p>}
        <div className={styles.listingInformation__map} aria-label="Место для карты">Карта</div>
      </Surface>
      <Surface as={SurfaceElement.Section} className={styles.listingInformation__panel}>
        <h2 className={styles.listingInformation__heading}>Заинтересованные пользователи</h2>
        <p className={styles.listingInformation__description}>
          Здесь будут отображаться пользователи, которым интересно это объявление.
        </p>
      </Surface>
    </div>
  );
}

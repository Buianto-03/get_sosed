import React from 'react';
import styles from './ListingContextCard.module.scss';

export type ListingContextCardProps = {
  title: string;
  price: number;
  imageUrl?: string;
  onOpen?: () => void;
};

export function ListingContextCard({ title, price, imageUrl, onOpen }: ListingContextCardProps): JSX.Element {
  return (
    <button className={styles.card} type="button" onClick={onOpen}>
      {imageUrl ? <img src={imageUrl} alt="" /> : <span className={styles.placeholder} aria-hidden="true">⌂</span>}
      <span className={styles.content}>
        <strong>{title}</strong>
        <span>{price.toLocaleString('ru-RU')} ₽ в месяц</span>
      </span>
    </button>
  );
}

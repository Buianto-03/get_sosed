import React from 'react';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';
import { YANDEX_API_KEY } from '@shared/config/env';
import { readCoordinates } from './helper';
import styles from './YMap.module.scss';

interface YMapProps {
  location: string;
}
export function YMap({ location }: YMapProps): JSX.Element {
  const center = readCoordinates(location);
  if (!center || !YANDEX_API_KEY) return <p>Карта недоступна: нет координат или ключа карты.</p>;
  return (
    <div className={styles.map__frame}>
      <YMaps query={{ apikey: YANDEX_API_KEY }}>
        <Map key={location} defaultState={{ center, zoom: 15 }} width="100%" height="100%">
          <Placemark geometry={center} />
        </Map>
      </YMaps>
    </div>
  );
}

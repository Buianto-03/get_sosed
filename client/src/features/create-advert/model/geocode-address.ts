import axios from 'axios';
import { YANDEX_API_KEY } from '@shared/config/env';
import type { ApiResponse } from './geocode';

export async function geocodeAddress(city: string, address: string): Promise<string | undefined> {
  if (!YANDEX_API_KEY) return undefined;
  try {
    const response = await axios.get<ApiResponse>('https://geocode-maps.yandex.ru/1.x/', { params: { apikey: YANDEX_API_KEY, geocode: `${city}, ${address}`, lang: 'ru_RU', format: 'json' }, timeout: 5000 });
    const point = response.data.response.GeoObjectCollection.featureMember[0]?.GeoObject.Point.pos.split(' ').map(Number);
    return point?.length === 2 && point.every(Number.isFinite) ? [point[1], point[0]].join(', ') : undefined;
  } catch { return undefined; }
}

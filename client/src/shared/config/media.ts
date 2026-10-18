import { API_URL } from './env';

export function getMediaUrl(
  value: string | null | undefined,
  apiUrl: string = API_URL,
): string | undefined {
  if (!value?.trim()) return undefined;
  if (/^https?:\/\//i.test(value)) return value;

  const pageOrigin = typeof window === 'undefined'
    ? 'http://localhost:3000'
    : window.location.origin;
  const apiOrigin = new URL(apiUrl, pageOrigin).origin;
  return new URL(value, `${apiOrigin}/`).href;
}

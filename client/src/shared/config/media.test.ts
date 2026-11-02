import { describe, expect, it } from 'vitest';
import { getMediaUrl } from './media';

describe('getMediaUrl', () => {
  it('resolves images against the API origin without its API path', () => {
    expect(getMediaUrl('/images/a.webp', 'https://api.example.com/api'))
      .toBe('https://api.example.com/images/a.webp');
    expect(getMediaUrl('images/a.webp', 'https://api.example.com/api/'))
      .toBe('https://api.example.com/images/a.webp');
  });

  it('uses the page origin for a relative API URL', () => {
    expect(getMediaUrl('/images/a.webp', '/api'))
      .toBe(`${window.location.origin}/images/a.webp`);
  });

  it('preserves absolute image URLs including query and hash', () => {
    const url = 'https://cdn.example.com/a.webp?size=2#photo';
    expect(getMediaUrl(url, 'https://api.example.com/api')).toBe(url);
  });

  it.each([null, undefined, '', '  '])('returns undefined for missing media: %s', (value) => {
    expect(getMediaUrl(value)).toBeUndefined();
  });
});

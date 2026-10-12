import { describe, expect, it } from 'vitest';
import { readFilters, writeFilters } from './filters';

describe('advert filter URL helpers', () => {
  it('round trips filter values and preserves unrelated query params', () => {
    const initial = new URLSearchParams('sort=new&city=Белград&tags=2,4&priceFrom=100');
    const filters = readFilters(initial);

    expect(filters.tagIds).toEqual([2, 4]);
    const next = writeFilters(initial, { ...filters, city: 'Нови Сад', tagIds: [4] });
    expect(next.get('sort')).toBe('new');
    expect(next.get('tags')).toBe('4');
    expect(readFilters(next).city).toBe('Нови Сад');
    expect(readFilters(initial).city).toBe('Белград');
  });
});

import { describe, expect, it } from 'vitest';
import { getTagCatalogView, getTagLabel, ListingCondition } from './tag-catalog';

const tags = [
  { id: 418, name: ListingCondition.Workspace },
  { id: 888, name: ListingCondition.PetsAllowed },
  { id: 28, name: 'Рядом с метро' },
  { id: 73, name: ListingCondition.NonSmoking },
  { id: 109, name: ListingCondition.PetsAllowed },
  { id: 56, name: ListingCondition.QuietEvenings },
  { id: 26, name: 'Рядом с метро' },
];

describe('tag catalog view', () => {
  it('orders the quick conditions by type and preserves API order for other tags', () => {
    const view = getTagCatalogView(tags);
    expect(view.error).toBeNull();
    expect(view.primary.map(({ id }) => id)).toEqual([73, 109, 56, 418]);
    expect(view.additional.map(({ id }) => id)).toEqual([888, 28, 26]);
    expect(view.byId.get(888)).toBe(tags[1]);
    expect(getTagLabel(view, 109)).toBe('Питомцы разрешены (#109)');
    expect(getTagLabel(view, 888)).toBe('Питомцы разрешены (#888)');
    expect(getTagLabel(view, 28)).toBe('Рядом с метро (#28)');
    expect(getTagLabel(view, 26)).toBe('Рядом с метро (#26)');
    expect(getTagLabel(view, 73)).toBe('Для некурящих');
    expect(getTagLabel(view, 999)).toBe('#999');
  });

  it('validates missing conditions and duplicate IDs without creating duplicate choices', () => {
    const missing = getTagCatalogView(tags.filter(({ id }) => id !== 418));
    expect(missing.error).toBe('В каталоге отсутствуют условия: С рабочим местом.');

    const duplicate = getTagCatalogView([...tags, { id: 109, name: 'Другая подпись' }]);
    expect(duplicate.error).toBe('В каталоге повторяются ID условий.');
    expect(duplicate.byId.get(109)?.name).toBe(ListingCondition.PetsAllowed);
    const visibleIds = [...duplicate.primary, ...duplicate.additional].map(({ id }) => id);
    expect(visibleIds).toEqual([...new Set(visibleIds)]);
  });

  it('reuses the derived view by array identity and rebuilds for a new response', () => {
    const original = getTagCatalogView(tags);
    expect(getTagCatalogView(tags)).toBe(original);
    const changed = getTagCatalogView([...tags, { id: 4, name: ListingCondition.Workspace }]);
    expect(changed).not.toBe(original);
    expect(changed.primary.map(({ id }) => id)).toContain(4);
    expect(original.primary.map(({ id }) => id)).toContain(418);
  });
});

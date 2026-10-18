import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import advertService from '../api/advertService';
import type { TagType } from './advert';
import { getPrimaryTags, ListingCondition, TagCatalogState } from './tag-catalog';
import { useTagCatalog } from './use-tag-catalog';

const tags: TagType[] = [
  { id: 418, name: ListingCondition.Workspace },
  { id: 73, name: ListingCondition.NonSmoking },
  { id: 28, name: 'Рядом с метро' },
  { id: 109, name: ListingCondition.PetsAllowed },
  { id: 56, name: ListingCondition.QuietEvenings },
];

describe('useTagCatalog', () => {
  it('loads all tags and resolves primary conditions with unchanged server IDs', async () => {
    const getTags = vi.spyOn(advertService, 'getTagsBySearch').mockResolvedValue(tags);
    const { result } = renderHook(useTagCatalog);
    expect(result.current.state).toBe(TagCatalogState.Loading);
    await waitFor(() => expect(result.current.state).toBe(TagCatalogState.Ready));
    expect(getTags).toHaveBeenCalledWith('');
    expect(result.current.tags).toEqual(tags);
    expect(getPrimaryTags(result.current.tags).map(({ id }) => id)).toEqual([73, 109, 56, 418]);
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.state).toBe(TagCatalogState.Ready));
    expect(result.current.tags).toEqual(tags);
  });

  it('reports failure and supports retry without replacing the catalog with demo data', async () => {
    vi.spyOn(advertService, 'getTagsBySearch')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(tags);
    const { result } = renderHook(useTagCatalog);
    await waitFor(() => expect(result.current.state).toBe(TagCatalogState.Error));
    expect(result.current.tags).toEqual([]);
    expect(result.current.error).toContain('Не удалось загрузить');
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.state).toBe(TagCatalogState.Ready));
    expect(result.current.error).toBeNull();
  });

  it('reports missing or ambiguous primary conditions rather than guessing IDs', async () => {
    vi.spyOn(advertService, 'getTagsBySearch')
      .mockResolvedValueOnce(tags.filter(({ name }) => name !== 'С рабочим местом'))
      .mockResolvedValueOnce([...tags, { id: 888, name: ListingCondition.Workspace }]);
    const { result } = renderHook(useTagCatalog);
    await waitFor(() => expect(result.current.state).toBe(TagCatalogState.Error));
    expect(result.current.error).toContain('отсутствуют условия: С рабочим местом');
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.error).toContain('повторяются условия'));
    expect(result.current.state).toBe(TagCatalogState.Error);
  });

  it('ignores a stale response after retry', async () => {
    let finishOld: (value: TagType[]) => void = () => undefined;
    const oldResponse = new Promise<TagType[]>((resolve) => { finishOld = resolve; });
    vi.spyOn(advertService, 'getTagsBySearch')
      .mockReturnValueOnce(oldResponse)
      .mockResolvedValueOnce(tags);
    const { result } = renderHook(useTagCatalog);
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.state).toBe(TagCatalogState.Ready));
    await act(async () => { finishOld([]); await oldResponse; });
    expect(result.current.state).toBe(TagCatalogState.Ready);
    expect(result.current.tags).toEqual(tags);
  });
});

import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import advertService from '../api/advertService';
import type { TagType } from './advertsModel';
import { getTagCatalogView, getTagLabel, ListingCondition, TagCatalogState } from './tag-catalog';
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
    expect(getTags.mock.calls[0][0]).toBe('');
    expect(getTags.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
    expect(result.current.tags).toEqual(tags);
    expect(getTagCatalogView(result.current.tags).primary.map(({ id }) => id)).toEqual([
      73, 109, 56, 418,
    ]);
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

  it('reports missing conditions and preserves duplicate names with stable IDs', async () => {
    vi.spyOn(advertService, 'getTagsBySearch')
      .mockResolvedValueOnce(tags.filter(({ name }) => name !== 'С рабочим местом'))
      .mockResolvedValueOnce([...tags, { id: 888, name: ListingCondition.Workspace }]);
    const { result } = renderHook(useTagCatalog);
    await waitFor(() => expect(result.current.state).toBe(TagCatalogState.Error));
    expect(result.current.error).toContain('отсутствуют условия: С рабочим местом');
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.state).toBe(TagCatalogState.Ready));
    const view = getTagCatalogView(result.current.tags);
    expect(view.primary.map(({ id }) => id)).toContain(418);
    expect(view.byId.has(888)).toBe(true);
    expect(getTagLabel(view, 888)).toBe('С рабочим местом (#888)');
  });

  it('ignores a stale response after retry', async () => {
    let finishOld: (value: TagType[]) => void = () => undefined;
    const oldResponse = new Promise<TagType[]>((resolve) => {
      finishOld = resolve;
    });
    const get = vi
      .spyOn(advertService, 'getTagsBySearch')
      .mockReturnValueOnce(oldResponse)
      .mockResolvedValueOnce(tags);
    const { result } = renderHook(useTagCatalog);
    const signal = get.mock.calls[0][1]?.signal;
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.state).toBe(TagCatalogState.Ready));
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      finishOld([]);
      await oldResponse;
    });
    expect(result.current.state).toBe(TagCatalogState.Ready);
    expect(result.current.tags).toEqual(tags);
  });
});

it('aborts only the unmounted catalog consumer and leaves another load active', async () => {
  let finish!: (value: TagType[]) => void;
  const get = vi
    .spyOn(advertService, 'getTagsBySearch')
    .mockImplementationOnce(
      () =>
        new Promise(() => {
          /* Pending until unmounted. */
        }),
    )
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
  const first = renderHook(useTagCatalog);
  const second = renderHook(useTagCatalog);
  first.unmount();
  expect(get.mock.calls[0][1]?.signal?.aborted).toBe(true);
  expect(get.mock.calls[1][1]?.signal?.aborted).toBe(false);
  await act(async () => {
    finish(tags);
  });
  await waitFor(() => expect(second.result.current.state).toBe(TagCatalogState.Ready));
  expect(second.result.current.error).toBeNull();
  second.unmount();
  expect(get.mock.calls[1][1]?.signal?.aborted).toBe(true);
});

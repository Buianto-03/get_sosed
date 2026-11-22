import React, { StrictMode } from 'react';
import type { ReactNode, ReactElement } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import advertService from '../api/advertService';
import type { TagType } from './advertsModel';
import { getTagCatalogView, getTagLabel, ListingCondition, TagCatalogState } from './tag-catalog';
import tagCatalogReducer from './tagCatalogSlice';
import { useTagCatalog } from './use-tag-catalog';

const tags: TagType[] = [
  { id: 418, name: ListingCondition.Workspace },
  { id: 73, name: ListingCondition.NonSmoking },
  { id: 28, name: 'Рядом с метро' },
  { id: 109, name: ListingCondition.PetsAllowed },
  { id: 56, name: ListingCondition.QuietEvenings },
];

interface WrapperProps {
  children: ReactNode;
}
function setup(strict = false): { wrapper: (props: WrapperProps) => ReactElement } {
  const store = configureStore({ reducer: { tagCatalog: tagCatalogReducer } });
  return {
    wrapper: ({ children }) => (
      <Provider store={store}>{strict ? <StrictMode>{children}</StrictMode> : children}</Provider>
    ),
  };
}

describe('useTagCatalog', () => {
  it('loads the complete catalog and lets explicit reload bypass TTL', async () => {
    const get = vi.spyOn(advertService, 'getTagsBySearch').mockResolvedValue(tags);
    const { result } = renderHook(useTagCatalog, setup());
    expect(result.current.state).toBe(TagCatalogState.Loading);
    await waitFor(() => expect(result.current.state).toBe(TagCatalogState.Ready));
    expect(get.mock.calls[0][0]).toBe('');
    expect(get.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
    expect(getTagCatalogView(result.current.tags).primary.map(({ id }) => id)).toEqual([
      73, 109, 56, 418,
    ]);
    act(() => result.current.reload());
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.state).toBe(TagCatalogState.Ready));
    expect(result.current.tags).toEqual(tags);
  });

  it('keeps the last successful catalog on refresh failure and supports retry', async () => {
    vi.spyOn(advertService, 'getTagsBySearch')
      .mockResolvedValueOnce(tags)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(tags);
    const { result } = renderHook(useTagCatalog, setup());
    await waitFor(() => expect(result.current.state).toBe(TagCatalogState.Ready));
    const previous = result.current.tags;
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.state).toBe(TagCatalogState.Error));
    expect(result.current.tags).toBe(previous);
    expect(result.current.error).toContain('Не удалось загрузить');
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.state).toBe(TagCatalogState.Ready));
    expect(result.current.error).toBeNull();
  });

  it('reports invalid catalogs without caching them as success and preserves duplicate names', async () => {
    vi.spyOn(advertService, 'getTagsBySearch')
      .mockResolvedValueOnce(tags.filter(({ id }) => id !== 418))
      .mockResolvedValueOnce([...tags, { id: 888, name: ListingCondition.Workspace }]);
    const { result } = renderHook(useTagCatalog, setup());
    await waitFor(() => expect(result.current.state).toBe(TagCatalogState.Error));
    expect(result.current.error).toContain('отсутствуют условия: С рабочим местом');
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.state).toBe(TagCatalogState.Ready));
    const view = getTagCatalogView(result.current.tags);
    expect(view.primary.map(({ id }) => id)).toContain(418);
    expect(getTagLabel(view, 888)).toBe('С рабочим местом (#888)');
  });

  it('shares one in-flight read, including reloads, and unmount does not cancel another consumer', async () => {
    let finish!: (value: TagType[]) => void;
    const get = vi.spyOn(advertService, 'getTagsBySearch').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const options = setup();
    const first = renderHook(useTagCatalog, options);
    const second = renderHook(useTagCatalog, options);
    act(() => {
      first.result.current.reload();
      second.result.current.reload();
    });
    expect(get).toHaveBeenCalledOnce();
    first.unmount();
    expect(get.mock.calls[0][1]?.signal?.aborted).toBe(false);
    await act(async () => {
      finish(tags);
    });
    await waitFor(() => expect(second.result.current.state).toBe(TagCatalogState.Ready));
    second.unmount();
    const next = renderHook(useTagCatalog, options);
    expect(next.result.current.state).toBe(TagCatalogState.Ready);
    expect(next.result.current.tags).toEqual(tags);
    expect(get).toHaveBeenCalledOnce();
  });

  it('finishes an unobserved public read into the cache and reuses it on return', async () => {
    let finish!: (value: TagType[]) => void;
    const get = vi.spyOn(advertService, 'getTagsBySearch').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const options = setup();
    const first = renderHook(useTagCatalog, options);
    first.unmount();
    expect(get.mock.calls[0][1]?.signal?.aborted).toBe(false);
    await act(async () => {
      finish(tags);
    });
    const next = renderHook(useTagCatalog, options);
    await waitFor(() => expect(next.result.current.state).toBe(TagCatalogState.Ready));
    expect(get).toHaveBeenCalledOnce();
  });

  it('does not duplicate the read during StrictMode effect replay', async () => {
    const get = vi.spyOn(advertService, 'getTagsBySearch').mockResolvedValue(tags);
    const { result } = renderHook(useTagCatalog, setup(true));
    await waitFor(() => expect(result.current.state).toBe(TagCatalogState.Ready));
    expect(get).toHaveBeenCalledOnce();
    expect(get.mock.calls[0][1]?.signal?.aborted).toBe(false);
  });
});

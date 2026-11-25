import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import type { TagCatalog } from './tag-catalog';
import { getTagCatalogOrigin } from './tagCatalogModel';
import { selectTagCatalogEntry } from './tagCatalogSelectors';
import { getTagCatalogThunk } from './tagCatalogThunk';

export function useTagCatalog(): TagCatalog {
  const dispatch = useAppDispatch();
  const origin = getTagCatalogOrigin();
  const { tags, state, error } = useAppSelector((root) => selectTagCatalogEntry(root, origin));
  const reload = useCallback((): void => {
    void dispatch(getTagCatalogThunk({ origin, force: true }));
  }, [dispatch, origin]);

  useEffect(() => {
    void dispatch(getTagCatalogThunk({ origin }));
    // The cache owns this public read and retains the result even after the last consumer leaves.
  }, [dispatch, origin]);

  return useMemo(() => ({ tags, state, error, reload }), [tags, state, error, reload]);
}

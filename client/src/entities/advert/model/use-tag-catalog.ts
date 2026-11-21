import { useCallback, useEffect, useMemo, useState } from 'react';
import advertService from '../api/advertService';
import { getTagCatalogView, TagCatalogState } from './tag-catalog';
import type { TagCatalog } from './tag-catalog';

export function useTagCatalog(): TagCatalog {
  const [attempt, setAttempt] = useState(0);
  const [catalog, setCatalog] = useState<Omit<TagCatalog, 'reload'>>({
    tags: [],
    state: TagCatalogState.Loading,
    error: null,
  });
  const reload = useCallback((): void => {
    setCatalog((current) => ({ ...current, state: TagCatalogState.Loading, error: null }));
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    void advertService
      .getTagsBySearch('')
      .then((tags) => {
        if (!active) {
          return;
        }
        const { error } = getTagCatalogView(tags);
        setCatalog({ tags, state: error ? TagCatalogState.Error : TagCatalogState.Ready, error });
      })
      .catch(() => {
        if (active) {
          setCatalog((current) => ({
            ...current,
            state: TagCatalogState.Error,
            error: 'Не удалось загрузить условия проживания.',
          }));
        }
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  return useMemo(() => ({ ...catalog, reload }), [catalog, reload]);
}

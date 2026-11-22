import { useCallback, useEffect, useMemo, useState } from 'react';
import { isRequestCanceled } from '@shared/api/cancellation';
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
    const controller = new AbortController();
    void advertService
      .getTagsBySearch('', { signal: controller.signal })
      .then((tags) => {
        if (!active) {
          return;
        }
        const { error } = getTagCatalogView(tags);
        setCatalog({ tags, state: error ? TagCatalogState.Error : TagCatalogState.Ready, error });
      })
      .catch((error: unknown) => {
        if (active) {
          setCatalog((current) => ({
            ...current,
            state: isRequestCanceled(error) ? TagCatalogState.Ready : TagCatalogState.Error,
            error: isRequestCanceled(error) ? null : 'Не удалось загрузить условия проживания.',
          }));
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  return useMemo(() => ({ ...catalog, reload }), [catalog, reload]);
}

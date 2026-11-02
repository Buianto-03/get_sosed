import React, { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import { LuSlidersHorizontal } from 'react-icons/lu';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import { Drawer } from '@shared/ui/overlay/Drawer';
import type { TagCatalog } from '@entities/advert/model/tag-catalog';
import {
  emptySearchFilters,
  validateSearch,
  type SearchFilterValues,
} from '../model/searchFilterValues';
import { FilterForm } from './FilterForm';
import styles from './SearchFilters.module.scss';

export { emptySearchFilters } from '../model/searchFilterValues';
export type { SearchFilterValues } from '../model/searchFilterValues';

interface SearchFiltersProps {
  tagCatalog: TagCatalog;
  applied: SearchFilterValues;
  onApply: (filters: SearchFilterValues) => void;
}

export function SearchFilters({ applied, onApply, tagCatalog }: SearchFiltersProps): JSX.Element {
  const id = useId();
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<SearchFilterValues>(applied);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    setDraft(applied);
  }, [applied]);

  const apply = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const validation = validateSearch(draft);
    setError(validation);
    if (validation) {
      return;
    }
    onApply(draft);
    closeDrawer();
  };

  const reset = (): void => {
    setError('');
    setDraft(emptySearchFilters);
    onApply(emptySearchFilters);
    closeDrawer();
  };

  return (
    <div className={styles.filters}>
      <section className={styles.filters__panel} aria-label="Фильтры поиска">
        <div className={styles.filters__heading}>
          <LuSlidersHorizontal aria-hidden="true" />
          <strong>Фильтры</strong>
        </div>
        <FilterForm
          tagCatalog={tagCatalog}
          idPrefix={`${id}-desktop`}
          error={drawerOpen ? undefined : error}
          draft={draft}
          onChange={setDraft}
          onApply={apply}
          onReset={reset}
        />
      </section>
      <Button
        className={styles.filters__mobileTrigger}
        variant={ButtonVariant.Secondary}
        onClick={() => setDrawerOpen(true)}
      >
        <LuSlidersHorizontal aria-hidden="true" />
        Фильтры и условия
      </Button>
      <Drawer open={drawerOpen} onClose={closeDrawer} title="Фильтры и условия">
        <FilterForm
          tagCatalog={tagCatalog}
          idPrefix={`${id}-drawer`}
          error={error}
          inDrawer
          draft={draft}
          onChange={setDraft}
          onApply={apply}
          onReset={reset}
        />
      </Drawer>
    </div>
  );
}

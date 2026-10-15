import React, { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import { LuSlidersHorizontal } from 'react-icons/lu';
import { Button, ButtonVariant } from '../../../shared/ui/button/Button';
import { Drawer } from '../../../shared/ui/overlay/Drawer';
import { emptySearchFilters, type SearchFilterValues } from '../model/searchFilterValues';
import { FilterForm } from './FilterForm';
import styles from './SearchFilters.module.scss';

export { emptySearchFilters } from '../model/searchFilterValues';
export type { SearchCondition, SearchFilterValues } from '../model/searchFilterValues';

type SearchFiltersProps = {
  applied: SearchFilterValues;
  onApply: (filters: SearchFilterValues) => void;
  getDrawerBoundary?: () => HTMLElement | null;
};

export function SearchFilters({ applied, onApply, getDrawerBoundary }: SearchFiltersProps): JSX.Element {
  const id = useId();
  const [draft, setDraft] = useState<SearchFilterValues>(applied);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    setDraft(applied);
  }, [applied]);

  const apply = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onApply(draft);
    closeDrawer();
  };

  const reset = (): void => {
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
          idPrefix={`${id}-desktop`}
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
      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title="Фильтры и условия"
        getBoundary={getDrawerBoundary}
      >
        <FilterForm
          idPrefix={`${id}-drawer`}
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

import React, { memo } from 'react';
import {
  getTagCatalogView,
  getTagLabel,
  TagCatalogState,
  type TagCatalog,
} from '@entities/listing/model';
import { TagCatalogFeedback } from '@entities/listing/ui/tag-catalog-feedback/TagCatalogFeedback';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import { Checkbox } from '@shared/ui/selection/checkbox/Checkbox';
import styles from './FilterConditions.module.scss';

interface FilterConditionsProps {
  catalog: TagCatalog;
  idPrefix: string;
  tagIds: readonly number[];
  onChange: (tagId: number, checked: boolean) => void;
}

function FilterConditionsView({
  catalog,
  idPrefix,
  tagIds,
  onChange,
}: FilterConditionsProps): JSX.Element {
  const view = getTagCatalogView(catalog.tags);
  const selected = new Set(tagIds);
  const disabled = catalog.state !== TagCatalogState.Ready;

  return (
    <>
      <TagCatalogFeedback catalog={catalog} />
      <div className={styles.conditions__list}>
        {view.primary.map((tag) => (
          <Checkbox
            key={tag.id}
            id={`${idPrefix}-condition-${tag.id}`}
            label={tag.name}
            disabled={disabled}
            checked={selected.has(tag.id)}
            onChange={(event) => onChange(tag.id, event.target.checked)}
          />
        ))}
      </div>
      <details>
        <summary>Все условия проживания</summary>
        {view.additional.map((tag) => (
          <Checkbox
            key={tag.id}
            id={`${idPrefix}-tag-${tag.id}`}
            label={getTagLabel(view, tag.id)}
            disabled={disabled}
            checked={selected.has(tag.id)}
            onChange={(event) => onChange(tag.id, event.target.checked)}
          />
        ))}
      </details>
      <div className={styles.conditions__list} aria-label="Выбранные условия">
        {tagIds.map((id) => (
          <Button key={id} variant={ButtonVariant.Text} onClick={() => onChange(id, false)}>
            {getTagLabel(view, id)} ×
          </Button>
        ))}
      </div>
    </>
  );
}

export const FilterConditions = memo(FilterConditionsView);

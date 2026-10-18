import React, { type FormEvent } from 'react';
import { Button, ButtonType, ButtonVariant } from '@shared/ui/button/Button';
import { Input } from '@shared/ui/input/Input';
import { Checkbox } from '@shared/ui/selection/checkbox/Checkbox';
import { Select } from '@shared/ui/selection/select/Select';
import { getPrimaryTags, TagCatalogState } from '@entities/advert/model/tag-catalog';
import type { TagCatalog } from '@entities/advert/model/tag-catalog';
import { TagCatalogFeedback } from '@entities/advert/ui/tag-catalog-feedback/TagCatalogFeedback';
import type { SearchFilterValues } from '../model/searchFilterValues';
import { inputFields } from './inputFields';
import styles from './FilterForm.module.scss';

interface FilterFormProps {
  idPrefix: string;
  tagCatalog: TagCatalog;
  inDrawer?: boolean;
  draft: SearchFilterValues;
  onChange: (draft: SearchFilterValues) => void;
  onApply: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}

export function FilterForm({
  idPrefix,
  tagCatalog,
  inDrawer = false,
  draft,
  onChange,
  onApply,
  onReset,
}: FilterFormProps): JSX.Element {
  const setField = (field: keyof Omit<SearchFilterValues, 'conditions'>, value: string): void => {
    onChange({ ...draft, [field]: value });
  };

  const setCondition = (condition: string, checked: boolean): void => {
    onChange({
      ...draft,
      conditions: checked
        ? [...draft.conditions, condition]
        : draft.conditions.filter((item) => item !== condition),
    });
  };

  return (
    <form
      className={[styles.filters__form, inDrawer && styles.filters__form_drawer]
        .filter(Boolean)
        .join(' ')}
      onSubmit={onApply}
    >
      <div className={styles.filters__fields}>
        <Select
          id={`${idPrefix}-city`}
          label="Город"
          placeholder="Все города"
          options={[
            { value: 'Москва', label: 'Москва' },
            { value: 'Санкт-Петербург', label: 'Санкт-Петербург' },
          ]}
          value={draft.city}
          onChange={(event) => setField('city', event.target.value)}
        />
        {inputFields.map((field) => (
          <Input
            key={field.name}
            id={`${idPrefix}-${field.idSuffix}`}
            label={field.label}
            type={field.type}
            min={field.min}
            placeholder={field.placeholder}
            value={draft[field.name]}
            onChange={(event) => setField(field.name, event.target.value)}
          />
        ))}
      </div>
      <TagCatalogFeedback catalog={tagCatalog} />
      <div className={styles.filters__conditions}>
        {getPrimaryTags(tagCatalog.tags).map((tag) => (
          <Checkbox
            key={tag.id}
            id={`${idPrefix}-condition-${tag.id}`}
            label={tag.name}
            disabled={tagCatalog.state !== TagCatalogState.Ready}
            checked={draft.conditions.includes(tag.name)}
            onChange={(event) => setCondition(tag.name, event.target.checked)}
          />
        ))}
      </div>
      <div className={styles.filters__actions}>
        <Button className={styles.filters__submit} type={ButtonType.Submit} disabled={tagCatalog.state !== TagCatalogState.Ready}>
          Показать объявления
        </Button>
        <Button variant={ButtonVariant.Text} onClick={onReset}>
          Сбросить фильтры
        </Button>
      </div>
    </form>
  );
}

import React, { type FormEvent } from 'react';
import { useFormFeedback } from '@shared/lib/forms/use-form-feedback';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { Button, ButtonType, ButtonVariant } from '@shared/ui/button/Button';
import { Input } from '@shared/ui/input/Input';
import type { TagCatalog } from '@entities/listing/model';
import type { SearchFilterValues } from '../model/searchFilterValues';
import { FilterConditions } from './filter-conditions/FilterConditions';
import { inputFields } from './inputFields';
import styles from './FilterForm.module.scss';

interface FilterFormProps {
  idPrefix: string;
  tagCatalog: TagCatalog;
  inDrawer?: boolean;
  draft: SearchFilterValues;
  onFieldChange: (field: keyof Omit<SearchFilterValues, 'tagIds'>, value: string) => void;
  onConditionChange: (tagId: number, checked: boolean) => void;
  onApply: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  error?: string;
}

export function FilterForm({
  idPrefix,
  tagCatalog,
  inDrawer = false,
  draft,
  onFieldChange,
  onConditionChange,
  onApply,
  onReset,
  error,
}: FilterFormProps): JSX.Element {
  const { formRef, requestFeedbackFocus } = useFormFeedback();

  return (
    <form
      ref={formRef}
      className={[styles.filters__form, inDrawer && styles.filters__form_drawer]
        .filter(Boolean)
        .join(' ')}
      onSubmit={(event) => {
        requestFeedbackFocus();
        onApply(event);
      }}
    >
      {error && <Alert variant={AlertVariant.Error}>{error}</Alert>}
      <div className={styles.filters__fields}>
        <Input
          id={`${idPrefix}-city`}
          label="Город"
          placeholder="Любой город"
          value={draft.city}
          onChange={(event) => onFieldChange('city', event.target.value)}
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
            onChange={(event) => onFieldChange(field.name, event.target.value)}
          />
        ))}
      </div>
      <FilterConditions
        catalog={tagCatalog}
        idPrefix={idPrefix}
        tagIds={draft.tagIds}
        onChange={onConditionChange}
      />
      <div className={styles.filters__actions}>
        <Button className={styles.filters__submit} type={ButtonType.Submit}>
          Показать объявления
        </Button>
        <Button variant={ButtonVariant.Text} onClick={onReset}>
          Сбросить фильтры
        </Button>
      </div>
    </form>
  );
}

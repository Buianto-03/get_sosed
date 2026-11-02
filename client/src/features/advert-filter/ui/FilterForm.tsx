import React, { type FormEvent } from 'react';
import { useFormFeedback } from '@shared/lib/forms/use-form-feedback';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { Button, ButtonType, ButtonVariant } from '@shared/ui/button/Button';
import { Input } from '@shared/ui/input/Input';
import { Checkbox } from '@shared/ui/selection/checkbox/Checkbox';
import { getPrimaryTags, getTagLabel, TagCatalogState } from '@entities/advert/model/tag-catalog';
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
  error?: string;
}

export function FilterForm({
  idPrefix,
  tagCatalog,
  inDrawer = false,
  draft,
  onChange,
  onApply,
  onReset,
  error,
}: FilterFormProps): JSX.Element {
  const { formRef, requestFeedbackFocus } = useFormFeedback();
  const setField = (field: keyof Omit<SearchFilterValues, 'tagIds'>, value: string): void => {
    onChange({ ...draft, [field]: value });
  };

  const setCondition = (condition: number, checked: boolean): void => {
    onChange({
      ...draft,
      tagIds: checked
        ? [...new Set([...draft.tagIds, condition])]
        : draft.tagIds.filter((item) => item !== condition),
    });
  };

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
            checked={draft.tagIds.includes(tag.id)}
            onChange={(event) => setCondition(tag.id, event.target.checked)}
          />
        ))}
      </div>
      <details>
        <summary>Все условия проживания</summary>
        {tagCatalog.tags
          .filter(
            (tag) => !getPrimaryTags(tagCatalog.tags).some((primary) => primary.id === tag.id),
          )
          .map((tag) => (
            <Checkbox
              key={tag.id}
              id={`${idPrefix}-tag-${tag.id}`}
              label={getTagLabel(tagCatalog.tags, tag.id)}
              disabled={tagCatalog.state !== TagCatalogState.Ready}
              checked={draft.tagIds.includes(tag.id)}
              onChange={(event) => setCondition(tag.id, event.target.checked)}
            />
          ))}
      </details>
      <div className={styles.filters__conditions} aria-label="Выбранные условия">
        {draft.tagIds.map((tagId) => (
          <Button
            key={tagId}
            variant={ButtonVariant.Text}
            onClick={() => setCondition(tagId, false)}
          >
            {getTagLabel(tagCatalog.tags, tagId)} ×
          </Button>
        ))}
      </div>
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

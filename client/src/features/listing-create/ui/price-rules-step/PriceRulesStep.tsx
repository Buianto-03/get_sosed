import React from 'react';
import { Input, InputType } from '@shared/ui/input/Input';
import { Textarea } from '@shared/ui/textarea/Textarea';
import type { TagCatalog } from '@entities/advert/model/tag-catalog';
import { validatePrice, type ListingDraft } from '../../model';
import { ListingRules } from '../listing-rules/ListingRules';
import styles from './PriceRulesStep.module.scss';

export interface PriceRulesStepProps {
  draft: ListingDraft;
  tagCatalog: TagCatalog;
  showErrors: boolean;
  onFieldChange: (field: keyof Omit<ListingDraft, 'tagIds'>, value: string) => void;
  onRuleChange: (rule: number, checked: boolean) => void;
}

export function PriceRulesStep({
  draft,
  tagCatalog,
  showErrors,
  onFieldChange,
  onRuleChange,
}: PriceRulesStepProps): JSX.Element {
  const errors = showErrors ? validatePrice(draft) : {};
  return (
    <div className={styles.price_rules_step}>
      <h2>Цена и правила</h2>
      <div className={styles.price_rules_step__form_grid}>
        <Input
          id="listing-price"
          label="Цена за месяц, ₽"
          type={InputType.Number}
          min="1"
          value={draft.price}
          onChange={(event) => onFieldChange('price', event.target.value)}
          hint="Укажите полную ежемесячную стоимость."
          required
          error={errors.price}
        />
        <Textarea
          id="listing-description"
          label="Описание"
          fieldClassName={styles.price_rules_step__description_field}
          value={draft.description}
          onChange={(event) => onFieldChange('description', event.target.value)}
          rows={5}
          hint="Расскажите о комнате и условиях проживания."
          required
          error={errors.description}
        />
        <ListingRules catalog={tagCatalog} tagIds={draft.tagIds} onChange={onRuleChange} />
      </div>
    </div>
  );
}

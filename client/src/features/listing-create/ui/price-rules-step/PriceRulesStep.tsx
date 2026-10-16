import React from 'react';
import { Input, InputType } from '@shared/ui/input/Input';
import { Checkbox } from '@shared/ui/selection/checkbox/Checkbox';
import { Textarea } from '@shared/ui/textarea/Textarea';
import type { ListingDraft } from '../../model';
import { listingRules } from './helper';
import styles from './PriceRulesStep.module.scss';

export interface PriceRulesStepProps {
  draft: ListingDraft;
  showErrors: boolean;
  onFieldChange: (field: keyof Omit<ListingDraft, 'rules'>, value: string) => void;
  onRuleChange: (rule: string, checked: boolean) => void;
}

export function PriceRulesStep({
  draft,
  showErrors,
  onFieldChange,
  onRuleChange,
}: PriceRulesStepProps): JSX.Element {
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
          error={showErrors && !(Number(draft.price) > 0) ? 'Укажите стоимость аренды.' : undefined}
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
          error={
            showErrors && !draft.description.trim() ? 'Добавьте описание объявления.' : undefined
          }
        />
        <fieldset className={styles.price_rules_step__rules}>
          <legend>Условия проживания</legend>
          {listingRules.map((rule) => (
            <Checkbox
              key={rule.id}
              id={`listing-rule-${rule.id}`}
              label={rule.label}
              checked={draft.rules.includes(rule.label)}
              onChange={(event) => onRuleChange(rule.label, event.target.checked)}
            />
          ))}
        </fieldset>
      </div>
    </div>
  );
}

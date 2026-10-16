import React from 'react';
import { Input, InputType } from '@shared/ui/input/Input';
import { Select } from '@shared/ui/selection/select/Select';
import type { ListingDraft } from '../../model';
import { cities, metroOptions } from './helper';
import styles from './RoomStep.module.scss';

export interface RoomStepProps {
  draft: ListingDraft;
  showErrors: boolean;
  onFieldChange: (field: keyof Omit<ListingDraft, 'rules'>, value: string) => void;
  onCityChange: (city: string) => void;
}

export function RoomStep({
  draft,
  showErrors,
  onFieldChange,
  onCityChange,
}: RoomStepProps): JSX.Element {
  const metros = draft.city === 'Казань' ? metroOptions.kazan : metroOptions.default;

  return (
    <div className={styles.room_step}>
      <h2>Расскажите о комнате</h2>
      <div className={styles.room_step__form_grid}>
        <Input
          id="listing-title"
          label="Название объявления"
          value={draft.title}
          onChange={(event) => onFieldChange('title', event.target.value)}
          required
          error={showErrors && !draft.title.trim() ? 'Укажите название комнаты.' : undefined}
        />
        <Select
          id="listing-city"
          label="Город"
          value={draft.city}
          onChange={(event) => onCityChange(event.target.value)}
          options={cities}
          placeholder="Выберите город"
          required
          error={showErrors && !draft.city ? 'Выберите город.' : undefined}
        />
        <Select
          id="listing-metro"
          label="Метро"
          value={draft.metro}
          onChange={(event) => onFieldChange('metro', event.target.value)}
          options={metros}
          placeholder="Выберите станцию"
          required
          disabled={!draft.city}
          error={showErrors && !draft.metro ? 'Выберите станцию метро.' : undefined}
        />
        <Input
          id="listing-area"
          label="Площадь комнаты, м²"
          type={InputType.Number}
          min="1"
          value={draft.area}
          onChange={(event) => onFieldChange('area', event.target.value)}
          required
          error={showErrors && !(Number(draft.area) > 0) ? 'Укажите площадь комнаты.' : undefined}
        />
      </div>
    </div>
  );
}

import React from 'react';
import { Input, InputType } from '@shared/ui/input/Input';
import { validateRoom, type ListingDraft } from '../../model';
import styles from './RoomStep.module.scss';

export interface RoomStepProps {
  draft: ListingDraft;
  showErrors: boolean;
  onFieldChange: (field: keyof Omit<ListingDraft, 'tagIds'>, value: string) => void;
  onCityChange: (city: string) => void;
}
export function RoomStep({
  draft,
  showErrors,
  onFieldChange,
  onCityChange,
}: RoomStepProps): JSX.Element {
  const errors = showErrors ? validateRoom(draft) : {};
  const fields: {
    name: keyof Omit<ListingDraft, 'tagIds'>;
    label: string;
    numeric?: boolean;
    required?: boolean;
  }[] = [
    { name: 'title', label: 'Название объявления', required: true },
    { name: 'city', label: 'Город', required: true },
    { name: 'district', label: 'Район' },
    { name: 'address', label: 'Адрес', required: true },
    { name: 'metro', label: 'Метро' },
    { name: 'area', label: 'Площадь комнаты, м²', numeric: true, required: true },
    { name: 'rooms', label: 'Количество комнат', numeric: true, required: true },
    { name: 'floor', label: 'Этаж', numeric: true, required: true },
  ];
  return (
    <div className={styles.room_step}>
      <h2>Расскажите о комнате</h2>
      <div className={styles.room_step__form_grid}>
        {fields.map((field) => (
          <Input
            key={field.name}
            id={`listing-${field.name}`}
            label={field.label}
            value={draft[field.name]}
            type={field.numeric ? InputType.Number : InputType.Text}
            min={field.numeric ? '1' : undefined}
            required={field.required}
            error={errors[field.name]}
            onChange={(event) =>
              field.name === 'city'
                ? onCityChange(event.target.value)
                : onFieldChange(field.name, event.target.value)
            }
          />
        ))}
      </div>
    </div>
  );
}

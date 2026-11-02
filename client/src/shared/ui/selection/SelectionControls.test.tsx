import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './checkbox/Checkbox';
import { RadioGroup, RadioOrientation } from './radio-group/RadioGroup';
import { Select } from './select/Select';

describe('selection controls', () => {
  it('connects a required select label and exposes its empty state', () => {
    render(
      <Select
        id="city"
        label="City"
        required
        defaultValue=""
        options={[{ value: 'belgrade', label: 'Belgrade' }]}
      />,
    );

    const select = screen.getByRole('combobox', { name: 'City' });

    expect(select).toBeRequired();
    expect(select).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Выберите вариант' })).toBeDisabled();
  });

  it('uses native checkbox and radio controls and reports radio changes', () => {
    const onValueChange = vi.fn();
    render(
      <>
        <Checkbox id="pets" label="Pets allowed" />
        <RadioGroup
          id="housing"
          name="housing"
          label="Housing type"
          value="room"
          onValueChange={onValueChange}
          orientation={RadioOrientation.Horizontal}
          options={[
            { value: 'room', label: 'Room' },
            { value: 'neighbor', label: 'Neighbor' },
            { value: 'disabled', label: 'Disabled choice', disabled: true },
          ]}
        />
      </>,
    );

    const checkbox = screen.getByRole('checkbox', { name: 'Pets allowed' });
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(screen.getByRole('radio', { name: 'Neighbor' }));
    expect(onValueChange).toHaveBeenCalledWith('neighbor');
    expect(screen.getByRole('radio', { name: 'Disabled choice' })).toBeDisabled();
  });
});

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Stepper } from './Stepper';

describe('Stepper', () => {
  it('marks completed, current, upcoming, and disabled steps', () => {
    const onStepChange = vi.fn();
    render(
      <Stepper
        currentStep={2}
        onStepChange={onStepChange}
        steps={[
          { id: 'place', label: 'О помещении' },
          { id: 'price', label: 'Цена' },
          { id: 'photos', label: 'Фотографии' },
          { id: 'publish', label: 'Публикация', disabled: true },
        ]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Цена, текущий шаг' })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('button', { name: 'О помещении, выполнен' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Публикация, недоступен' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Фотографии, предстоит' }));
    expect(onStepChange).toHaveBeenCalledWith(3);
  });
});

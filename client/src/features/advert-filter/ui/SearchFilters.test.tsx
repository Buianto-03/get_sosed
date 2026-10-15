import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SearchFilters, emptySearchFilters } from './SearchFilters';

describe('SearchFilters', () => {
  it('applies the draft only after submission and resets it locally', () => {
    const onApply = vi.fn();
    render(<SearchFilters applied={emptySearchFilters} onApply={onApply} />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Город' }), {
      target: { value: 'Москва' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Питомцы разрешены' }));
    expect(onApply).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Показать объявления' }));
    expect(onApply).toHaveBeenLastCalledWith({
      ...emptySearchFilters,
      city: 'Москва',
      conditions: ['Питомцы разрешены'],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));
    expect(onApply).toHaveBeenLastCalledWith(emptySearchFilters);
    expect(screen.getByRole('combobox', { name: 'Город' })).toHaveValue('');
    expect(screen.getByRole('checkbox', { name: 'Питомцы разрешены' })).not.toBeChecked();
  });

  it('closes the drawer on Escape and restores scrolling and focus', () => {
    const onApply = vi.fn();
    render(<SearchFilters applied={emptySearchFilters} onApply={onApply} />);
    const trigger = screen.getByRole('button', { name: 'Фильтры и условия' });

    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Фильтры и условия' });
    expect(document.body.style.overflow).toBe('hidden');
    expect(within(dialog).getByRole('button', { name: 'Закрыть' })).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
    expect(trigger).toHaveFocus();
  });
});

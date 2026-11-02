import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ListingCondition, TagCatalogState } from '@entities/advert/model/tag-catalog';
import type { TagCatalog } from '@entities/advert/model/tag-catalog';
import { SearchFilters, emptySearchFilters } from './SearchFilters';

const tagCatalog: TagCatalog = {
  tags: [
    { id: 73, name: ListingCondition.NonSmoking },
    { id: 29, name: ListingCondition.PetsAllowed },
    { id: 56, name: ListingCondition.QuietEvenings },
    { id: 112, name: ListingCondition.Workspace },
  ],
  state: TagCatalogState.Ready,
  error: null,
  reload: () => undefined,
};

describe('SearchFilters', () => {
  it('keeps a range error inside the open drawer and focuses it without applying', () => {
    const onApply = vi.fn();
    render(<SearchFilters tagCatalog={tagCatalog} applied={emptySearchFilters} onApply={onApply} />);
    fireEvent.click(screen.getByRole('button', { name: 'Фильтры и условия' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByRole('spinbutton', { name: 'Цена от, ₽' }), { target: { value: '50000' } });
    fireEvent.change(within(dialog).getByRole('spinbutton', { name: 'Цена до, ₽' }), { target: { value: '1000' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Показать объявления' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Цена от не может быть больше цены до.');
    expect(within(dialog).getByRole('alert')).toHaveFocus();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(onApply).not.toHaveBeenCalled();
  });

  it('applies the draft only after submission and resets it locally', () => {
    const onApply = vi.fn();
    render(
      <SearchFilters tagCatalog={tagCatalog} applied={emptySearchFilters} onApply={onApply} />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Город' }), {
      target: { value: 'Москва' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Питомцы разрешены' }));
    expect(onApply).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Показать объявления' }));
    expect(onApply).toHaveBeenLastCalledWith({
      ...emptySearchFilters,
      city: 'Москва',
      tagIds: [29],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));
    expect(onApply).toHaveBeenLastCalledWith(emptySearchFilters);
    expect(screen.getByRole('textbox', { name: 'Город' })).toHaveValue('');
    expect(screen.getByRole('checkbox', { name: 'Питомцы разрешены' })).not.toBeChecked();
  });

  it('closes the drawer on Escape and restores scrolling and focus', () => {
    const onApply = vi.fn();
    render(
      <SearchFilters tagCatalog={tagCatalog} applied={emptySearchFilters} onApply={onApply} />,
    );
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

  it('preserves the draft and selected conditions through a catalog failure and retry', () => {
    const reload = vi.fn();
    const onApply = vi.fn();
    const { rerender } = render(
      <SearchFilters tagCatalog={tagCatalog} applied={emptySearchFilters} onApply={onApply} />,
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Город' }), {
      target: { value: 'Москва' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Питомцы разрешены' }));
    expect(screen.getByRole('checkbox', { name: 'Питомцы разрешены' }).id).toContain(
      'condition-29',
    );
    rerender(
      <SearchFilters
        tagCatalog={{
          ...tagCatalog,
          state: TagCatalogState.Error,
          error: 'Сеть недоступна',
          reload,
        }}
        applied={emptySearchFilters}
        onApply={onApply}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Сеть недоступна');
    expect(screen.getByRole('button', { name: 'Показать объявления' })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: 'Питомцы разрешены' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Повторить загрузку условий' }));
    expect(reload).toHaveBeenCalledOnce();
    rerender(
      <SearchFilters tagCatalog={tagCatalog} applied={emptySearchFilters} onApply={onApply} />,
    );
    expect(screen.getByRole('textbox', { name: 'Город' })).toHaveValue('Москва');
    expect(screen.getByRole('checkbox', { name: 'Питомцы разрешены' })).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Показать объявления' }));
    expect(onApply).toHaveBeenLastCalledWith({
      ...emptySearchFilters,
      city: 'Москва',
      tagIds: [29],
    });
  });
});

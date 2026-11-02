/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ProfileListingsSection } from './ProfileListingsSection';

it('returns focus to the collection heading when the focused favorite is removed', () => {
  const props = {
    headingId: 'favorites', title: 'Избранное',
    emptyState: { title: 'Пусто', description: 'Добавьте объявление', icon: null, action: null },
    actions: { onOpen: vi.fn(), onToggleSaved: vi.fn() },
  };
  const collection = { items: [{ id: '1', listing: { title: 'Комната', price: 20000 }, saved: true }], total: 1, loading: false, error: null, onRetry: vi.fn() };
  const { rerender } = render(<ProfileListingsSection {...props} collection={collection} />);
  act(() => screen.getByRole('button', { name: 'Убрать из избранного' }).focus());
  rerender(<ProfileListingsSection {...props} collection={{ ...collection, items: [], total: 0 }} />);
  expect(screen.getByRole('heading', { name: 'Избранное' })).toHaveFocus();
  expect(screen.getByText('Пусто')).toBeInTheDocument();
});

it('preserves focus outside the collection when a previously focused favorite is removed', () => {
  const props = {
    headingId: 'favorites', title: 'Избранное',
    emptyState: { title: 'Пусто', description: 'Добавьте объявление', icon: null, action: null },
    actions: { onOpen: vi.fn(), onToggleSaved: vi.fn() },
  };
  const collection = { items: [{ id: '1', listing: { title: 'Комната', price: 20000 }, saved: true }], total: 1, loading: false, error: null, onRetry: vi.fn() };
  const { rerender } = render(
    <><button type="button">Другое действие</button><ProfileListingsSection {...props} collection={collection} /></>,
  );
  act(() => screen.getByRole('button', { name: 'Убрать из избранного' }).focus());
  const outsideAction = screen.getByRole('button', { name: 'Другое действие' });
  act(() => outsideAction.focus());

  rerender(
    <><button type="button">Другое действие</button><ProfileListingsSection {...props} collection={{ ...collection, items: [], total: 0 }} /></>,
  );
  expect(outsideAction).toHaveFocus();
});

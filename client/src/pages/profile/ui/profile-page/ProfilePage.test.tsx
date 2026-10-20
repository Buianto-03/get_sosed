import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { routes } from '@shared/config/routes';
import { ProfilePage } from './ProfilePage';

it.each([
  { placement: 'heading', index: 0 },
  { placement: 'empty listings', index: 1 },
])('opens listing creation from $placement without a navigation callback', ({ index }) => {
  const onFindListings = vi.fn();
  const emptyCollection = {
    items: [],
    total: 0,
    loading: false,
    error: null,
    onRetry: vi.fn(),
  };

  render(
    <MemoryRouter initialEntries={[routes.profile]}>
      <Routes>
        <Route
          path={routes.profile}
          element={
            <ProfilePage
              profile={null}
              favorites={emptyCollection}
              myListings={emptyCollection}
              navigation={{ onEditProfile: vi.fn(), onFindListings }}
              listingActions={{ onOpen: vi.fn(), onToggleSaved: vi.fn() }}
            />
          }
        />
        <Route path={routes.listingCreate} element={<h1>Новое объявление</h1>} />
      </Routes>
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Найти объявления' }));
  expect(onFindListings).toHaveBeenCalledOnce();

  const buttons = screen.getAllByRole('button', { name: 'Разместить объявление' });
  expect(buttons).toHaveLength(2);
  fireEvent.click(buttons[index]);
  expect(screen.getByRole('heading', { name: 'Новое объявление' })).toBeInTheDocument();
});

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { routes } from '@shared/config/routes';
import { ProfilePage } from './ProfilePage';

const emptyCollection = {
  items: [],
  total: 0,
  loading: false,
  error: null,
  onRetry: vi.fn(),
};

it.each([
  { name: 'Разместить объявление', index: 0, destination: 'Новое объявление' },
  { name: 'Разместить объявление', index: 1, destination: 'Новое объявление' },
  { name: 'Найти объявления', index: 0, destination: 'Объявления' },
  { name: 'Сообщения', index: 0, destination: 'Диалоги' },
  { name: 'Заполнить профиль', index: 0, destination: 'Редактирование профиля' },
])('opens $destination from $name ($index)', ({ name, index, destination }) => {
  render(
    <MemoryRouter initialEntries={[routes.profile]}>
      <Routes>
        <Route
          path={routes.profile}
          element={
            <ProfilePage profile={null} favorites={emptyCollection} myListings={emptyCollection} />
          }
        />
        <Route path={routes.listingCreate} element={<h1>Новое объявление</h1>} />
        <Route path={routes.listings} element={<h1>Объявления</h1>} />
        <Route path={routes.messages} element={<h1>Диалоги</h1>} />
        <Route path={routes.profileEdit} element={<h1>Редактирование профиля</h1>} />
      </Routes>
    </MemoryRouter>,
  );

  fireEvent.click(screen.getAllByRole('button', { name })[index]);
  expect(screen.getByRole('heading', { name: destination })).toBeInTheDocument();
});

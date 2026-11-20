import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, Link } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import authReducer, { clearAuth } from '@entities/session/model/authSlice';
import { SiteLayout } from './SiteLayout';

describe('SiteLayout keyboard navigation', () => {
  it('moves focus to the destination heading and supports skipping navigation', async () => {
    const store = configureStore({ reducer: { auth: authReducer } });
    store.dispatch(clearAuth());

    render(
      <Provider store={store}>
        <MemoryRouter>
          <SiteLayout>
            <Routes>
              <Route
                path="/"
                element={
                  <main>
                    <h1>Главная страница</h1>
                    <Link to="/about">Открыть описание</Link>
                  </main>
                }
              />
              <Route path="/about" element={<main><h1>Описание проекта</h1></main>} />
            </Routes>
          </SiteLayout>
        </MemoryRouter>
      </Provider>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'Открыть описание' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Описание проекта' })).toHaveFocus());
    fireEvent.click(screen.getByRole('link', { name: 'К основному содержимому' }));
    expect(screen.getByRole('main')).toHaveFocus();
    expect(screen.getAllByRole('main')).toHaveLength(1);
  });
});

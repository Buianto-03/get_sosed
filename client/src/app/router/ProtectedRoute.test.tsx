import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RoutePattern, routes } from '@shared/config/routes';
import { UserStatus } from '@entities/session/model/auth';
import authReducer, { clearAuth, setSession } from '@entities/session/model/authSlice';
import ProtectedRoute from './ProtectedRoute';

function CurrentLocation(): JSX.Element {
  const location = useLocation();
  return <output data-testid="location">{location.pathname + location.search + location.hash}</output>;
}

function renderProtectedRoute(initialEntry: string, status: UserStatus): void {
  const store = configureStore({ reducer: { auth: authReducer } });
  if (status === UserStatus.Guest) store.dispatch(clearAuth());
  if (status === UserStatus.Logged) {
    store.dispatch(setSession({
      accessToken: 'test-token',
      user: { id: 3, name: 'User', email: 'user@example.com', roleId: 2 },
    }));
  }

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path={RoutePattern.ListingCreate}
            element={<ProtectedRoute access="logged"><p>Страница публикации</p></ProtectedRoute>}
          />
          <Route
            path="/messages/:receiverId"
            element={<ProtectedRoute access="logged"><p>Переписка</p></ProtectedRoute>}
          />
          <Route
            path={RoutePattern.SignIn}
            element={<ProtectedRoute access="guest"><p>Форма входа</p></ProtectedRoute>}
          />
          <Route
            path={RoutePattern.SignUp}
            element={<ProtectedRoute access="guest"><p>Форма регистрации</p></ProtectedRoute>}
          />
          <Route path={RoutePattern.Profile} element={<p>Профиль</p>} />
          <Route path="*" element={<p>404</p>} />
        </Routes>
        <CurrentLocation />
      </MemoryRouter>
    </Provider>,
  );
}

describe('ProtectedRoute authentication redirects', () => {
  it('sends a guest to sign-in with the full protected path, query and hash', () => {
    const target = '/listings/new?draft=1#photos';
    renderProtectedRoute(target, UserStatus.Guest);

    expect(screen.getByText('Форма входа')).toBeInTheDocument();
    const location = screen.getByTestId('location').textContent ?? '';
    expect(location.startsWith(routes.signIn)).toBe(true);
    expect(new URLSearchParams(location.split('?')[1]).get('returnTo')).toBe(target);
  });

  it('returns an authenticated user to the safe destination from sign-in', () => {
    const target = '/messages/7?listingId=4#composer';
    const query = new URLSearchParams({ returnTo: target });
    renderProtectedRoute(`${routes.signIn}?${query.toString()}`, UserStatus.Logged);

    expect(screen.getByText('Переписка')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(target);
  });

  it.each(['https://outside.example', '//outside.example', '/sign-up?returnTo=/profile'])(
    'falls back to profile for an unsafe destination: %s',
    (returnTo) => {
      const query = new URLSearchParams({ returnTo });
      renderProtectedRoute(`${routes.signIn}?${query.toString()}`, UserStatus.Logged);

      expect(screen.getByText('Профиль')).toBeInTheDocument();
      expect(screen.getByTestId('location')).toHaveTextContent(routes.profile);
    },
  );

  it('keeps the pending session on the requested page while showing a status', () => {
    renderProtectedRoute('/listings/new', UserStatus.Pending);

    expect(screen.getByRole('status', { name: 'Проверяем сессию' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/listings/new');
  });
});

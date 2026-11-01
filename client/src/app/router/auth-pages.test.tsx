import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import SignInRoute from '@pages/sign-in/ui/sign-in-route/SignInRoute';
import SignUpRoute from '@pages/sign-up/ui/sign-up-route/SignUpRoute';
import axiosInstance from '@shared/api/client';
import { clearAuth } from '@entities/session/model/authSlice';
import { UserStatus } from '@entities/session/model/authModel';
import { store } from '../store/store';

const session = {
  user: { id: 1, name: 'Анна', email: 'anna@example.com', roleId: 2 },
  accessToken: 'token',
};
function Location(): JSX.Element {
  const location = useLocation();
  return (
    <output data-testid="location">{location.pathname + location.search + location.hash}</output>
  );
}
function open(path: string): void {
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Location />
        <Routes>
          <Route path="/sign-in" element={<SignInRoute />} />
          <Route path="/sign-up" element={<SignUpRoute />} />
          <Route path="*" element={<div>Назначение</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}
function fillSignIn(): void {
  fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), { target: { value: 'anna@example.com' } });
  fireEvent.change(screen.getByLabelText(/^Пароль/), { target: { value: 'password1' } });
}
function fillSignUp(): void {
  fillSignIn();
  fireEvent.change(screen.getByRole('textbox', { name: 'Имя' }), { target: { value: 'Анна' } });
  fireEvent.change(screen.getByLabelText(/^Повторите пароль/), { target: { value: 'password1' } });
}
beforeEach(() => {
  store.dispatch(clearAuth());
  vi.spyOn(axiosInstance, 'get').mockResolvedValue({ data: [] });
});
afterEach(() => {
  cleanup();
  store.dispatch(clearAuth());
  vi.restoreAllMocks();
});

it('submits sign-in once while pending and returns to the complete destination after success', async () => {
  let resolve!: (value: { data: typeof session }) => void;
  const post = vi.spyOn(axiosInstance, 'post').mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  open('/sign-in?returnTo=%2Flistings%3Fcity%3DМосква%23results');
  fillSignIn();
  const form = screen.getByRole('button', { name: 'Войти' }).closest('form');
  if (!form) throw new Error('Missing sign-in form');
  fireEvent.submit(form); // Enter submits the same form event.
  fireEvent.submit(form);
  expect(post).toHaveBeenCalledTimes(1);
  expect(post).toHaveBeenCalledWith('/auth/login', {
    email: 'anna@example.com',
    password: 'password1',
  });
  expect(screen.getByRole('textbox', { name: 'Email' })).toBeDisabled();
  expect(screen.getByTestId('location')).toHaveTextContent('/sign-in');
  await act(async () => {
    resolve({ data: session });
  });
  await waitFor(() =>
    expect(decodeURI(screen.getByTestId('location').textContent ?? '')).toBe(
      '/listings?city=Москва#results',
    ),
  );
  expect(store.getState().auth.user.status).toBe(UserStatus.Logged);
});

it('keeps values and allows retry after a failed sign-in', async () => {
  const post = vi
    .spyOn(axiosInstance, 'post')
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue({ data: session });
  open('/sign-in');
  fillSignIn();
  fireEvent.click(screen.getByRole('button', { name: 'Войти' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось войти');
  expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('anna@example.com');
  expect(screen.getByRole('alert')).toHaveFocus();
  expect(store.getState().auth.user.status).toBe(UserStatus.Guest);
  fireEvent.click(screen.getByRole('button', { name: 'Войти' }));
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/profile'));
  expect(post).toHaveBeenCalledTimes(2);
});

it('validates fields and carries returnTo between authentication pages', () => {
  const post = vi.spyOn(axiosInstance, 'post');
  open('/sign-in?returnTo=%2Flistings%2Fnew');
  fireEvent.click(screen.getByRole('button', { name: 'Войти' }));
  expect(screen.getByText('Введите корректный email.')).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Email' })).toHaveFocus();
  expect(post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/sign-up?returnTo=%2Flistings%2Fnew');
  fillSignUp();
  fireEvent.change(screen.getByLabelText(/^Повторите пароль/), { target: { value: 'other' } });
  fireEvent.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));
  expect(screen.getByText('Пароли не совпадают.')).toBeInTheDocument();
  expect(screen.getByLabelText(/^Повторите пароль/)).toHaveFocus();
  fireEvent.change(screen.getByLabelText(/^Пароль/), { target: { value: 'no-digits-here' } });
  fireEvent.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));
  expect(screen.getByText('Не менее 9 символов и одна цифра.')).toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Войти' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/sign-in?returnTo=%2Flistings%2Fnew');
});

it('registers without gender/photo/confirmation, reports occupied email and installs the session on retry', async () => {
  const post = vi
    .spyOn(axiosInstance, 'post')
    .mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 409, data: { code: 'EMAIL_ALREADY_EXISTS' } },
    })
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue({ data: session });
  open('/sign-up?returnTo=%2Flistings%2Fnew');
  fillSignUp();
  const submit = screen.getByRole('button', { name: 'Зарегистрироваться' });
  fireEvent.click(submit);
  expect(await screen.findByText('Этот email уже зарегистрирован.')).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Имя' })).toHaveValue('Анна');
  expect(screen.getByRole('textbox', { name: 'Email' })).toHaveFocus();
  expect(store.getState().auth.user.status).toBe(UserStatus.Guest);
  const [url, data] = post.mock.calls[0];
  expect(url).toBe('/auth/signup');
  expect(Array.from((data as FormData).entries())).toEqual([
    ['name', 'Анна'],
    ['email', 'anna@example.com'],
    ['password', 'password1'],
  ]);
  fireEvent.click(submit);
  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось зарегистрироваться');
  fireEvent.click(submit);
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/listings/new'));
  expect(store.getState().auth.user.status).toBe(UserStatus.Logged);
});

import type { LoginForm } from '@entities/session/model/authModel';

export function validateSignIn(values: LoginForm): Partial<Record<keyof LoginForm, string>> {
  const errors: Partial<Record<keyof LoginForm, string>> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = 'Введите корректный email.';
  if (!values.password) errors.password = 'Введите пароль.';
  return errors;
}

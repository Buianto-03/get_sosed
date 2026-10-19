import type { SignUpValues } from '../sign-up-card/SignUpCard';

export function validateSignUp(values: SignUpValues): Partial<Record<keyof SignUpValues, string>> {
  const errors: Partial<Record<keyof SignUpValues, string>> = {};
  if (!values.name.trim()) errors.name = 'Введите имя.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = 'Введите корректный email.';
  if (values.password.length < 9 || !/\d/.test(values.password))
    errors.password = 'Не менее 9 символов и одна цифра.';
  if (values.password !== values.confirmPassword) errors.confirmPassword = 'Пароли не совпадают.';
  return errors;
}

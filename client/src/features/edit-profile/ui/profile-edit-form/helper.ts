export type ProfileEditValues = {
  name: string;
  city: string;
  intent: string;
  description: string;
  habits: string;
  age: string;
  phoneNumber: string;
};

export type ProfileEditErrors = Partial<Record<keyof ProfileEditValues, string>>;

export function validateProfileEdit(values: ProfileEditValues): ProfileEditErrors {
  const errors: ProfileEditErrors = {};
  if (values.name.trim().length < 2) errors.name = 'Введите имя не короче двух символов.';
  if (!values.city.trim()) errors.city = 'Укажите город.';
  if (values.description.trim().length < 10) {
    errors.description = 'Расскажите о себе не менее чем в 10 символах.';
  }
  if (values.description.trim().length > 500) {
    errors.description = 'Описание должно быть не длиннее 500 символов.';
  }
  if (values.habits.split(',').some((habit) => habit.trim().length > 40)) {
    errors.habits = 'Каждая привычка должна быть не длиннее 40 символов.';
  }
  if (
    values.age &&
    (!Number.isInteger(Number(values.age)) || Number(values.age) < 18 || Number(values.age) > 120)
  )
    errors.age = 'Возраст от 18 до 120 лет.';
  if (values.phoneNumber && !/^[+\d ()-]{5,32}$/.test(values.phoneNumber))
    errors.phoneNumber = 'Введите корректный номер телефона.';
  if (values.name.trim().length > 100) errors.name = 'Не более 100 символов.';
  if (values.city.length > 100) errors.city = 'Не более 100 символов.';
  if (values.intent.length > 255) errors.intent = 'Не более 255 символов.';
  if (values.habits.split(',').filter((v) => v.trim()).length > 20)
    errors.habits = 'Не более 20 предпочтений.';
  return errors;
}

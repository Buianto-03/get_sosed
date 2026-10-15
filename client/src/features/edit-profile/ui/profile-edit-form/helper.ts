export type ProfileEditValues = {
  name: string;
  city: string;
  intent: string;
  description: string;
  habits: string;
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
  return errors;
}

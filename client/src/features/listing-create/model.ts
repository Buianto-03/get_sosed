export interface ListingDraft {
  title: string;
  city: string;
  district: string;
  address: string;
  metro: string;
  area: string;
  rooms: string;
  floor: string;
  price: string;
  description: string;
  tagIds: number[];
}
export enum ListingCreatePublishState {
  Idle = 'idle',
  Loading = 'loading',
  Error = 'error',
  Success = 'success',
}
export function validateRoom(draft: ListingDraft): Partial<Record<keyof ListingDraft, string>> {
  const errors: Partial<Record<keyof ListingDraft, string>> = {};
  if (!draft.title.trim() || draft.title.length > 100)
    errors.title = 'Укажите название комнаты (до 100 символов).';
  if (!draft.city.trim() || draft.city.length > 100)
    errors.city = 'Укажите город (до 100 символов).';
  if (!draft.address.trim() || draft.address.length > 255)
    errors.address = 'Укажите адрес (до 255 символов).';
  if (draft.district.length > 100) errors.district = 'Не более 100 символов.';
  if (draft.metro.length > 100) errors.metro = 'Не более 100 символов.';
  (['area', 'rooms', 'floor'] as const).forEach((field) => {
    const value = Number(draft[field]);
    if (!Number.isSafeInteger(value) || value <= 0 || value > 2147483647)
      errors[field] = 'Введите целое положительное число.';
  });
  return errors;
}
export function validatePrice(draft: ListingDraft): Partial<Record<keyof ListingDraft, string>> {
  const errors: Partial<Record<keyof ListingDraft, string>> = {};
  if (
    !Number.isSafeInteger(Number(draft.price)) ||
    Number(draft.price) <= 0 ||
    Number(draft.price) > 2147483647
  )
    errors.price = 'Укажите стоимость аренды целым положительным числом.';
  if (!draft.description.trim() || draft.description.length > 10000)
    errors.description = 'Добавьте описание объявления (до 10 000 символов).';
  return errors;
}

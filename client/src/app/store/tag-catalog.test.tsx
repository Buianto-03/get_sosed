import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SearchFilters, emptySearchFilters } from '@features/advert-filter/ui/SearchFilters';
import type { SearchFilterValues } from '@features/advert-filter/model/searchFilterValues';
import { ListingCreatePage } from '@pages/listing-create/ui/listing-create-page/ListingCreatePage';
import { listingService } from '@entities/listing/api/listingService';
import {
  ListingCondition,
  TagCatalogState,
  tagCatalogReducer,
  getTagCatalogThunk,
  getTagCatalogOrigin,
  type TagCatalogRoot,
  SavedStatus,
} from '@entities/listing/model';
import { useTagCatalog } from '@entities/listing/model/use-tag-catalog';
import { clearAuth, setSession } from '@entities/session/model/authSlice';
import { store as appStore } from './store';

const tags = Object.values(ListingCondition).map((name, index) => ({ id: index + 1, name }));
const applied = { ...emptySearchFilters, tagIds: [999] };
const origin = getTagCatalogOrigin();
function makeStore(): ReturnType<typeof configureStore<TagCatalogRoot>> {
  return configureStore({ reducer: { tagCatalog: tagCatalogReducer } });
}
interface SearchConsumerProps {
  onApply: (value: SearchFilterValues) => void;
}
function SearchConsumer({ onApply }: SearchConsumerProps): JSX.Element {
  const catalog = useTagCatalog();
  return <SearchFilters tagCatalog={catalog} applied={applied} onApply={onApply} />;
}
function CreateConsumer(): JSX.Element {
  const catalog = useTagCatalog();
  return (
    <ListingCreatePage
      tagCatalog={catalog}
      initialStep={2}
      initialDraft={{
        title: 'Комната',
        city: 'Казань',
        address: 'Улица, 1',
        area: '18',
        rooms: '2',
        floor: '3',
        price: '',
        description: '',
        tagIds: [999],
      }}
    />
  );
}
afterEach(() => {
  appStore.dispatch(clearAuth());
});

it('preserves the search draft and unknown IDs through a real cache refresh failure and retry', async () => {
  const get = vi
    .spyOn(listingService, 'getTagsBySearch')
    .mockResolvedValueOnce(tags)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce([...tags, { id: 999, name: 'Рядом с парком' }]);
  const store = makeStore();
  const onApply = vi.fn();
  render(
    <Provider store={store}>
      <SearchConsumer onApply={onApply} />
    </Provider>,
  );
  await waitFor(() =>
    expect(screen.getByRole('checkbox', { name: ListingCondition.PetsAllowed })).toBeEnabled(),
  );
  fireEvent.change(screen.getByRole('textbox', { name: 'Город' }), { target: { value: 'Москва' } });
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Цена от, ₽' }), {
    target: { value: '32000' },
  });
  fireEvent.click(screen.getByRole('checkbox', { name: ListingCondition.PetsAllowed }));
  await act(async () => {
    await store.dispatch(getTagCatalogThunk({ origin, force: true }));
  });
  expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить условия');
  expect(screen.getByRole('button', { name: '#999 ×' })).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: ListingCondition.PetsAllowed })).toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Повторить загрузку условий' }));
  await waitFor(() =>
    expect(screen.getByRole('checkbox', { name: ListingCondition.PetsAllowed })).toBeEnabled(),
  );
  expect(get).toHaveBeenCalledTimes(3);
  expect(screen.getByRole('textbox', { name: 'Город' })).toHaveValue('Москва');
  expect(screen.getByRole('spinbutton', { name: 'Цена от, ₽' })).toHaveValue(32000);
  expect(screen.getByRole('button', { name: 'Рядом с парком ×' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Показать объявления' }));
  expect(onApply).toHaveBeenLastCalledWith({
    ...applied,
    city: 'Москва',
    priceFrom: '32000',
    tagIds: [999, 2],
  });
});

it('preserves publication fields, selected conditions and unknown draft IDs across cache retry', async () => {
  vi.spyOn(listingService, 'getTagsBySearch')
    .mockResolvedValueOnce(tags)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(tags);
  const store = makeStore();
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CreateConsumer />
      </MemoryRouter>
    </Provider>,
  );
  await waitFor(() =>
    expect(screen.getByRole('checkbox', { name: ListingCondition.PetsAllowed })).toBeEnabled(),
  );
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Цена за месяц, ₽' }), {
    target: { value: '32000' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: 'Описание' }), {
    target: { value: 'Сохранённый черновик' },
  });
  fireEvent.click(screen.getByRole('checkbox', { name: ListingCondition.PetsAllowed }));
  await act(async () => {
    await store.dispatch(getTagCatalogThunk({ origin, force: true }));
  });
  expect(screen.getByRole('checkbox', { name: ListingCondition.PetsAllowed })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Повторить загрузку условий' }));
  await waitFor(() =>
    expect(screen.getByRole('checkbox', { name: ListingCondition.PetsAllowed })).toBeEnabled(),
  );
  expect(screen.getByRole('checkbox', { name: ListingCondition.PetsAllowed })).toBeChecked();
  expect(screen.getByRole('spinbutton', { name: 'Цена за месяц, ₽' })).toHaveValue(32000);
  expect(screen.getByRole('textbox', { name: 'Описание' })).toHaveValue('Сохранённый черновик');
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
  expect(screen.getByRole('heading', { name: 'Цена и правила' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
  expect(screen.getByRole('textbox', { name: 'Название объявления' })).toHaveValue('Комната');
});

it('keeps the public catalog across a real session change', async () => {
  const get = vi.spyOn(listingService, 'getTagsBySearch').mockResolvedValue(tags);
  vi.spyOn(listingService, 'getLikedListings').mockResolvedValue([]);
  await appStore.dispatch(getTagCatalogThunk({ origin, force: true }));
  const cache = appStore.getState().tagCatalog;
  appStore.dispatch(
    setSession({
      accessToken: 'token',
      user: { id: 101, name: 'User', email: 'a@b.c', roleId: 1 },
    }),
  );
  await waitFor(() => expect(appStore.getState().likedListings.status).toBe(SavedStatus.Ready));
  appStore.dispatch(clearAuth());
  await appStore.dispatch(getTagCatalogThunk({ origin }));
  expect(get).toHaveBeenCalledOnce();
  expect(appStore.getState().tagCatalog).toBe(cache);
  expect(cache.entries[origin]?.state).toBe(TagCatalogState.Ready);
  expect(cache.entries[origin]?.tags).toEqual(tags);
});

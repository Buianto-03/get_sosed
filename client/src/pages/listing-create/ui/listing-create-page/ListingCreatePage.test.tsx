import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ListingCondition, TagCatalogState } from '@entities/advert/model/tag-catalog';
import type { TagCatalog } from '@entities/advert/model/tag-catalog';
import { ListingCreatePage } from './ListingCreatePage';

const tagCatalog: TagCatalog = {
  tags: [
    { id: 73, name: ListingCondition.NonSmoking },
    { id: 29, name: ListingCondition.PetsAllowed },
    { id: 56, name: ListingCondition.QuietEvenings },
    { id: 112, name: ListingCondition.Workspace },
  ],
  state: TagCatalogState.Ready,
  error: null,
  reload: () => undefined,
};

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
});

describe('ListingCreatePage', () => {
  it('validates forward navigation and preserves fields when a step is revisited', () => {
    render(<ListingCreatePage tagCatalog={tagCatalog} />);

    fireEvent.click(screen.getByRole('button', { name: 'Публикация, предстоит' }));
    expect(screen.getByRole('heading', { name: 'Расскажите о комнате' })).toBeInTheDocument();
    expect(screen.getByText('Укажите название комнаты.')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Название объявления' }), {
      target: { value: 'Светлая комната' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Город' }), {
      target: { value: 'Москва' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Метро' }), {
      target: { value: 'Сокол' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Площадь комнаты, м²' }), {
      target: { value: '18' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

    expect(screen.getByRole('heading', { name: 'Цена и правила' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Название объявления' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Публикация, предстоит' }));
    expect(screen.getByRole('heading', { name: 'Цена и правила' })).toBeInTheDocument();
    expect(screen.getByText('Укажите стоимость аренды.')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Цена за месяц, ₽' }), {
      target: { value: '30000' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Описание' }), {
      target: { value: 'Рядом с метро' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Публикация, предстоит' }));

    expect(screen.getByRole('heading', { name: 'Проверьте объявление' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByRole('heading', { name: 'Добавьте фотографии' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByRole('spinbutton', { name: 'Цена за месяц, ₽' })).toHaveValue(30000);
    expect(screen.getByRole('textbox', { name: 'Описание' })).toHaveValue('Рядом с метро');
    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByRole('textbox', { name: 'Название объявления' })).toHaveValue(
      'Светлая комната',
    );
  });

  it('keeps selected photos across steps and revokes their URLs when removed or closed', () => {
    const createObjectURL = vi
      .fn()
      .mockReturnValueOnce('blob:bedroom')
      .mockReturnValueOnce('blob:kitchen');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });

    const { unmount } = render(<ListingCreatePage tagCatalog={tagCatalog} initialStep={3} />);
    fireEvent.change(screen.getByLabelText('Выбрать фото · выбор файлов'), {
      target: {
        files: [
          new File(['bedroom'], 'bedroom.jpg', { type: 'image/jpeg' }),
          new File(['kitchen'], 'kitchen.jpg', { type: 'image/jpeg' }),
        ],
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(screen.getByRole('img', { name: 'bedroom.jpg' })).toHaveAttribute('src', 'blob:bedroom');
    expect(revokeObjectURL).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByText('bedroom.jpg')).toBeInTheDocument();
    expect(screen.getByText('kitchen.jpg')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Сделать главным фото: kitchen.jpg' }));
    fireEvent.click(screen.getByRole('button', { name: 'Удалить фото: bedroom.jpg' }));
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:bedroom');

    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(screen.getByRole('img', { name: 'kitchen.jpg' })).toHaveAttribute('src', 'blob:kitchen');

    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:kitchen');
  });

  it('shows a failed publication and allows a successful retry', async () => {
    const onPublish = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network'))
      .mockResolvedValueOnce(undefined);
    render(
      <ListingCreatePage
        tagCatalog={tagCatalog}
        initialStep={4}
        initialDraft={{
          title: 'Светлая комната',
          city: 'Москва',
          metro: 'Сокол',
          area: '18',
          price: '30000',
          description: 'Рядом с метро',
        }}
        onPublish={onPublish}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Опубликовать' }));
    expect(await screen.findByText('Не удалось опубликовать объявление')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Опубликовать' }));
    expect(await screen.findByText('Объявление опубликовано в preview')).toBeInTheDocument();
    expect(onPublish).toHaveBeenCalledTimes(2);
  });

  it('receives all four API conditions and keeps selection and input across retry', () => {
    const reload = vi.fn();
    const { rerender } = render(<ListingCreatePage tagCatalog={tagCatalog} initialStep={2} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Цена за месяц, ₽' }), {
      target: { value: '32000' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Питомцы разрешены' }));
    rerender(<ListingCreatePage
      tagCatalog={{ ...tagCatalog, state: TagCatalogState.Error, error: 'Сеть недоступна', reload }}
      initialStep={2}
    />);
    expect(screen.getByRole('checkbox', { name: 'Питомцы разрешены' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(screen.getByRole('heading', { name: 'Цена и правила' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Повторить загрузку условий' }));
    expect(reload).toHaveBeenCalledOnce();
    rerender(<ListingCreatePage tagCatalog={tagCatalog} initialStep={2} />);
    expect(screen.getByRole('checkbox', { name: 'Питомцы разрешены' })).toBeChecked();
    expect(screen.getByRole('spinbutton', { name: 'Цена за месяц, ₽' })).toHaveValue(32000);
  });

});

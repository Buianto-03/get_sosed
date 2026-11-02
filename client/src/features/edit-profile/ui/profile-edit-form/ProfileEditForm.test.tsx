import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileEditForm } from './ProfileEditForm';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ProfileEditForm', () => {
  it('validates fields and selected photo before saving', () => {
    const onSave = vi.fn();
    const createObjectURL = vi.fn(() => 'blob:avatar');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    const { unmount } = render(
      <ProfileEditForm profile={null} onSave={onSave} onCancel={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Сохранить изменения' }));
    expect(screen.getByText('Введите имя не короче двух символов.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole('textbox', { name: 'Имя' }), { target: { value: 'Анна' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Город' }), { target: { value: 'Москва' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'О себе' }), { target: { value: 'Люблю тихие вечера и прогулки.' } });
    const input = screen.getByLabelText('Выбрать фото · выбор файлов');
    fireEvent.change(input, { target: { files: [new File(['bad'], 'note.txt', { type: 'text/plain' })] } });
    expect(screen.getByText('Выберите фото в формате JPG, PNG или WebP.')).toBeInTheDocument();

    const photo = new File(['image'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [photo] } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить изменения' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Анна', city: 'Москва' }), photo);
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:avatar');
  });
});

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UploadArea, type UploadAreaPhoto } from './UploadArea';

describe('UploadArea', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    Reflect.deleteProperty(URL, 'createObjectURL');
    Reflect.deleteProperty(URL, 'revokeObjectURL');
  });

  function mockObjectUrls(preview = 'blob:preview'): { revokeObjectURL: ReturnType<typeof vi.fn> } {
    const createObjectURL = vi.fn(() => preview);
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    return { revokeObjectURL };
  }

  it('previews photos, marks a main photo, and removes a photo locally', () => {
    const { revokeObjectURL } = mockObjectUrls('blob:photo-preview');
    render(<UploadArea id="listing-photos" label="Фотографии объявления" />);

    const picker = screen.getByLabelText('Выбрать фото · выбор файлов');
    const bedroom = new File(['image'], 'bedroom.jpg', { type: 'image/jpeg' });
    const kitchen = new File(['image'], 'kitchen.jpg', { type: 'image/jpeg' });
    fireEvent.change(picker, { target: { files: [bedroom, kitchen] } });

    expect(screen.getByText('bedroom.jpg')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Главное фото: bedroom.jpg' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Сделать главным фото: kitchen.jpg' }));
    expect(screen.getByRole('button', { name: 'Главное фото: kitchen.jpg' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Удалить фото: bedroom.jpg' }));
    expect(screen.queryByText('bedroom.jpg')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Главное фото: kitchen.jpg' })).toHaveFocus();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:photo-preview');
    fireEvent.click(screen.getByRole('button', { name: 'Удалить фото: kitchen.jpg' }));
    expect(screen.getByRole('button', { name: 'Выбрать фото' })).toHaveFocus();
  });

  it('shows validation errors for unsupported files and excessive file size', () => {
    mockObjectUrls();
    const { rerender } = render(
      <UploadArea id="type-check" label="Фотографии" maxFileSizeMb={1} />,
    );
    fireEvent.change(screen.getByLabelText('Выбрать фото · выбор файлов'), {
      target: { files: [new File(['text'], 'notes.txt', { type: 'text/plain' })] },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('неподдерживаемый формат');

    rerender(<UploadArea id="size-check" label="Фотографии" maxFileSizeMb={1} />);
    const largePhoto = new File([new Uint8Array(1024 * 1024 + 1)], 'large.jpg', {
      type: 'image/jpeg',
    });
    fireEvent.change(screen.getByLabelText('Выбрать фото · выбор файлов'), {
      target: { files: [largePhoto] },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('размер больше 1 МБ');
  });

  it('uses the supplied value and leaves preview URL cleanup to its owner', () => {
    const { revokeObjectURL } = mockObjectUrls('blob:controlled-photo');
    const onChange = vi.fn<[UploadAreaPhoto[]], void>();
    const { rerender, unmount } = render(
      <UploadArea id="controlled-photos" label="Фотографии" value={[]} onChange={onChange} />,
    );

    const photo = new File(['image'], 'bedroom.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Выбрать фото · выбор файлов'), {
      target: { files: [photo] },
    });

    const selectedPhotos = onChange.mock.calls[0][0];
    expect(selectedPhotos).toEqual([
      expect.objectContaining({ file: photo, previewUrl: 'blob:controlled-photo', isMain: true }),
    ]);
    expect(screen.queryByText('bedroom.jpg')).not.toBeInTheDocument();

    rerender(
      <UploadArea
        id="controlled-photos"
        label="Фотографии"
        value={selectedPhotos}
        onChange={onChange}
      />,
    );
    expect(screen.getByText('bedroom.jpg')).toBeInTheDocument();

    const remove = screen.getByRole('button', { name: 'Удалить фото: bedroom.jpg' });
    remove.focus();
    fireEvent.click(remove);
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    rerender(
      <UploadArea id="controlled-photos" label="Фотографии" value={selectedPhotos} onChange={onChange} />,
    );
    expect(remove).toHaveFocus();

    rerender(
      <UploadArea id="controlled-photos" label="Фотографии" value={[]} onChange={onChange} />,
    );
    expect(screen.getByRole('button', { name: 'Выбрать фото' })).toHaveFocus();

    unmount();
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });
});

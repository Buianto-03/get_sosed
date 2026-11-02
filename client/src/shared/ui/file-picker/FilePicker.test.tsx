import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FilePicker, FilePickerAccept } from './FilePicker';

describe('FilePicker', () => {
  it('returns selected files and clears the input to allow selecting them again', () => {
    const onFilesSelected = vi.fn();
    render(
      <FilePicker
        id="photo-picker"
        label="Выбрать фото"
        onFilesSelected={onFilesSelected}
        accept={[FilePickerAccept.Jpeg, FilePickerAccept.Png]}
        multiple
      />,
    );
    const file = new File(['image'], 'room.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText<HTMLInputElement>('Выбрать фото · выбор файлов');
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
    expect(input.value).toBe('');
  });
});

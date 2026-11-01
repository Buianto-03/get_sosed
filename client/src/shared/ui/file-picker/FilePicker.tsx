import React, { useRef } from 'react';
import styles from './FilePicker.module.scss';

export enum FilePickerAccept {
  Images = 'image/*',
  Jpeg = 'image/jpeg',
  Png = 'image/png',
  Webp = 'image/webp',
}

export interface FilePickerProps {
  id: string;
  label: string;
  onFilesSelected: (files: File[]) => void;
  accept?: FilePickerAccept[];
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FilePicker({
  id,
  label,
  onFilesSelected,
  accept = [FilePickerAccept.Images],
  multiple = false,
  disabled = false,
  className,
}: FilePickerProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={[styles.picker, className].filter(Boolean).join(' ')}>
      <input
        ref={inputRef}
        id={id}
        className={styles.input}
        type="file"
        accept={accept.join(',')}
        multiple={multiple}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        aria-label={`${label} · выбор файлов`}
        onChange={(event) => {
          onFilesSelected(Array.from(event.currentTarget.files ?? []));
          event.currentTarget.value = '';
        }}
      />
      <button
        className={styles.button}
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        aria-controls={id}
      >
        {label}
      </button>
    </div>
  );
}

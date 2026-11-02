/* eslint-disable react/jsx-props-no-spreading */
import React, { type TextareaHTMLAttributes } from 'react';
import { Field, type FieldPresentationProps } from '../field/Field';
import styles from './Textarea.module.scss';

export enum TextareaResize {
  Vertical = 'vertical',
  None = 'none',
}

export type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> &
FieldPresentationProps & {
  resize?: TextareaResize;
  fieldClassName?: string;
};

export function Textarea({
  id,
  label,
  required = false,
  hint,
  error,
  disabled = false,
  resize = TextareaResize.Vertical,
  fieldClassName,
  className,
  ...textareaProps
}: TextareaProps): JSX.Element {
  const messageIds = [
    hint ? `${id}-hint` : undefined,
    error ? `${id}-error` : undefined,
  ].filter(Boolean).join(' ');
  const describedBy = [textareaProps['aria-describedby'], messageIds]
    .filter(Boolean)
    .join(' ');

  return (
    <Field
      id={id}
      label={label}
      required={required}
      hint={hint}
      error={error}
      disabled={disabled}
      className={fieldClassName}
    >
      <textarea
        {...textareaProps}
        id={id}
        className={[styles.textarea, styles[resize], className].filter(Boolean).join(' ')}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : textareaProps['aria-invalid']}
        aria-describedby={describedBy || undefined}
      />
    </Field>
  );
}

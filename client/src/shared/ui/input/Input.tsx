/* eslint-disable react/jsx-props-no-spreading */
import React, { type InputHTMLAttributes, type ReactNode } from 'react';
import { Field, type FieldPresentationProps } from '../field/Field';
import styles from './Input.module.scss';

export enum InputType {
  Text = 'text',
  Email = 'email',
  Password = 'password',
  Search = 'search',
  Number = 'number',
  Tel = 'tel',
}

export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'size' | 'type'
> & FieldPresentationProps & {
  type?: InputType;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fieldClassName?: string;
};

export function Input({
  id,
  label,
  required = false,
  hint,
  error,
  disabled = false,
  type = InputType.Text,
  leadingIcon,
  trailingIcon,
  fieldClassName,
  className,
  ...inputProps
}: InputProps): JSX.Element {
  const messageIds = [
    hint ? `${id}-hint` : undefined,
    error ? `${id}-error` : undefined,
  ].filter(Boolean).join(' ');
  const describedBy = [inputProps['aria-describedby'], messageIds]
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
      <span className={styles.control}>
        {leadingIcon && (
          <span className={styles.leadingIcon} aria-hidden="true">{leadingIcon}</span>
        )}
        <input
          {...inputProps}
          id={id}
          className={[
            styles.input,
            leadingIcon && styles.withLeadingIcon,
            trailingIcon && styles.withTrailingIcon,
            className,
          ].filter(Boolean).join(' ')}
          type={type}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : inputProps['aria-invalid']}
          aria-describedby={describedBy || undefined}
        />
        {trailingIcon && (
          <span className={styles.trailingIcon} aria-hidden="true">{trailingIcon}</span>
        )}
      </span>
    </Field>
  );
}

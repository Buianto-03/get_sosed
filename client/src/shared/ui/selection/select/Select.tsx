/* eslint-disable react/jsx-props-no-spreading */
import React, { type SelectHTMLAttributes } from 'react';
import { LuChevronDown } from 'react-icons/lu';
import { Field, type FieldPresentationProps } from '../../field/Field';
import styles from './Select.module.scss';

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'id' | 'size' | 'children'
> & FieldPresentationProps & {
  options: SelectOption[];
  placeholder?: string;
  fieldClassName?: string;
};

export function Select({
  id,
  label,
  required = false,
  hint,
  error,
  disabled = false,
  options,
  placeholder = 'Выберите вариант',
  fieldClassName,
  className,
  ...selectProps
}: SelectProps): JSX.Element {
  const messageIds = [
    hint ? `${id}-hint` : undefined,
    error ? `${id}-error` : undefined,
  ].filter(Boolean).join(' ');
  const describedBy = [selectProps['aria-describedby'], messageIds]
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
        <select
          {...selectProps}
          id={id}
          className={[styles.select, className].filter(Boolean).join(' ')}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : selectProps['aria-invalid']}
          aria-describedby={describedBy || undefined}
        >
          <option value="" disabled={required}>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <LuChevronDown className={styles.chevron} aria-hidden="true" />
      </span>
    </Field>
  );
}

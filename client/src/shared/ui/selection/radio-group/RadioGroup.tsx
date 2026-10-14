import React, { type ChangeEvent } from 'react';
import styles from './RadioGroup.module.scss';

export enum RadioOrientation {
  Vertical = 'vertical',
  Horizontal = 'horizontal',
}

export type RadioOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type RadioGroupProps = {
  id: string;
  name: string;
  label: string;
  options: RadioOption[];
  value: string;
  onValueChange: (value: string) => void;
  orientation?: RadioOrientation;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string;
  className?: string;
};

export function RadioGroup({
  id,
  name,
  label,
  options,
  value,
  onValueChange,
  orientation = RadioOrientation.Vertical,
  required = false,
  disabled = false,
  hint,
  error,
  className,
}: RadioGroupProps): JSX.Element {
  const describedBy = [
    hint ? `${id}-hint` : undefined,
    error ? `${id}-error` : undefined,
  ].filter(Boolean).join(' ');
  const classes = [
    styles.options,
    styles[orientation],
    disabled && styles.disabled,
    className,
  ].filter(Boolean).join(' ');

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onValueChange(event.currentTarget.value);
  };

  return (
    <fieldset
      className={styles.group}
      disabled={disabled}
      aria-describedby={describedBy || undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className={styles.legend}>
        {label}
        {required && <span className={styles.required} aria-hidden="true">*</span>}
      </legend>
      <div className={classes}>
        {options.map((option, index) => {
          const optionId = `${id}-${index}`;
          const optionDisabled = disabled || Boolean(option.disabled);
          return (
            <label
              className={styles.option}
              htmlFor={optionId}
              key={option.value}
              data-disabled={optionDisabled || undefined}
            >
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={handleChange}
                required={required}
                disabled={optionDisabled}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
      {hint && <span className={styles.hint} id={`${id}-hint`}>{hint}</span>}
      {error && (
        <span className={styles.error} id={`${id}-error`} role="alert">
          {error}
        </span>
      )}
    </fieldset>
  );
}

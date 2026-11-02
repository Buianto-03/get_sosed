import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from './Input';
import { Textarea } from '../textarea/Textarea';

describe('text field components', () => {
  it('associates labels, hints, required state, and errors with an input', () => {
    render(
      <Input
        id="email"
        label="Email"
        required
        hint="Use your contact email"
        error="Enter a valid email address"
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Email' });

    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-hint email-error');
    expect(screen.getByText('Enter a valid email address')).toHaveAttribute('role', 'alert');
  });

  it('supports disabled and read-only controls and labels a textarea', () => {
    render(
      <>
        <Input id="disabled" label="Disabled" disabled />
        <Input id="readonly" label="Read only" value="Fixed" readOnly />
        <Textarea id="about" label="About" hint="A short introduction" />
      </>,
    );

    expect(screen.getByRole('textbox', { name: 'Disabled' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Read only' })).toHaveAttribute('readonly');
    expect(screen.getByRole('textbox', { name: 'About' }))
      .toHaveAttribute('aria-describedby', 'about-hint');
  });
});

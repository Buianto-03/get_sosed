import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tabs } from './Tabs';

function TabsHarness(): JSX.Element {
  const [value, setValue] = useState('overview');
  return (
    <Tabs
      id="account-tabs"
      label="Разделы аккаунта"
      value={value}
      onValueChange={setValue}
      tabs={[
        { id: 'overview', label: 'Обзор' },
        { id: 'settings', label: 'Настройки' },
        { id: 'private', label: 'Недоступно', disabled: true },
      ]}
    />
  );
}

describe('Tabs', () => {
  it('changes tabs with arrows and skips disabled tabs', () => {
    render(<TabsHarness />);
    const overview = screen.getByRole('tab', { name: 'Обзор' });
    overview.focus();
    fireEvent.keyDown(overview, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Настройки' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Настройки' }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Обзор' })).toHaveAttribute('aria-selected', 'true');
  });
});

import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import PreviewApp from './PreviewApp';

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('redesign preview navigation', () => {
  it('keeps the selected screen and shareable query in sync with header links', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <PreviewApp />
      </MemoryRouter>,
    );

    const navigation = screen.getByRole('navigation', { name: 'Основная навигация' });
    fireEvent.click(within(navigation).getByRole('link', { name: 'Поиск' }));

    expect(screen.getByLabelText('Экран превью')).toHaveValue('search');
    expect(new URLSearchParams(window.location.search).get('screen')).toBe('search');
  });

  it('shows sign-in for a protected screen in guest mode', () => {
    render(
      <MemoryRouter initialEntries={['/post']}>
        <PreviewApp />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Экран превью')).toHaveValue('signin');
  });
});

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

  it('uses footer links to navigate between preview screens', () => {
    render(
      <MemoryRouter initialEntries={['/signin']}>
        <PreviewApp />
      </MemoryRouter>,
    );

    const footer = screen.getByRole('navigation', { name: 'Навигация в подвале' });
    fireEvent.click(within(footer).getByRole('link', { name: 'О нас' }));
    expect(screen.getByLabelText('Экран превью')).toHaveValue('about');
  });

  it('uses the fullscreen layout without a footer for chat', () => {
    window.history.replaceState(null, '', '/?header=user');
    render(
      <MemoryRouter initialEntries={['/chat/1']}>
        <PreviewApp />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Экран превью')).toHaveValue('chat');
    expect(screen.queryByRole('navigation', { name: 'Навигация в подвале' })).not.toBeInTheDocument();
  });

  it('updates the profile favorites and exposes the empty profile state', () => {
    window.history.replaceState(null, '', '/?screen=profile&header=user');
    render(
      <MemoryRouter initialEntries={['/account']}>
        <PreviewApp />
      </MemoryRouter>,
    );

    const favorites = screen.getByRole('region', { name: 'Избранное' });
    expect(within(favorites).getAllByRole('article')).toHaveLength(2);
    fireEvent.click(within(favorites).getAllByRole('button', { name: 'Убрать из избранного' })[0]);
    fireEvent.click(within(favorites).getByRole('button', { name: 'Убрать из избранного' }));
    expect(within(favorites).getByText('Пока нет сохранённых объявлений')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Состояние превью'), { target: { value: 'empty-profile' } });
    expect(screen.getByText('Расскажите о себе')).toBeInTheDocument();
  });
});

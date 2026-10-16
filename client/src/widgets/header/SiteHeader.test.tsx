import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { SiteHeader, type SiteHeaderProps } from './SiteHeader';

function CurrentPath(): JSX.Element {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

function renderHeader(props: SiteHeaderProps = {}, initialPath = '/'): void {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <SiteHeader user={props.user} onSignOut={props.onSignOut} />
      <CurrentPath />
    </MemoryRouter>,
  );
}

describe('SiteHeader', () => {
  it('marks the active route and navigates from the guest header', () => {
    renderHeader({}, '/listings');

    const navigation = screen.getByRole('navigation', { name: 'Основная навигация' });
    expect(within(navigation).getByRole('link', { name: 'Поиск' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    fireEvent.click(within(navigation).getByRole('link', { name: 'Регистрация' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/sign-up');
  });

  it('opens and closes the mobile menu with Escape and outside click', () => {
    renderHeader();

    const trigger = screen.getByRole('button', { name: 'Меню' });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const menu = screen.getByRole('navigation', { name: 'Мобильное меню' });
    expect(within(menu).getByRole('link', { name: 'Сообщения' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('navigation', { name: 'Мобильное меню' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('navigation', { name: 'Мобильное меню' })).not.toBeInTheDocument();

    fireEvent.click(trigger);
    fireEvent.click(
      within(screen.getByRole('navigation', { name: 'Мобильное меню' })).getByRole('link', {
        name: 'О нас',
      }),
    );
    expect(screen.getByTestId('current-path')).toHaveTextContent('/about');
    expect(screen.queryByRole('navigation', { name: 'Мобильное меню' })).not.toBeInTheDocument();
  });

  it('shows the member actions and profile menu', () => {
    const onSignOut = vi.fn();
    renderHeader({ user: { name: 'Александр Петров' }, onSignOut }, '/profile');

    const navigation = screen.getByRole('navigation', { name: 'Основная навигация' });
    expect(within(navigation).queryByRole('link', { name: 'Войти' })).not.toBeInTheDocument();
    fireEvent.click(within(navigation).getByRole('link', { name: 'Разместить объявление' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/listings/new');

    fireEvent.click(within(navigation).getByRole('button', { name: 'Меню профиля: Александр Петров' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Выйти' }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('hides navigation items while their destinations have not been registered', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <SiteHeader availableRoutes={['home', 'search', 'signin', 'signup']} />
      </MemoryRouter>,
    );

    const navigation = screen.getByRole('navigation', { name: 'Основная навигация' });
    expect(within(navigation).getByRole('link', { name: 'Поиск' })).toBeInTheDocument();
    expect(within(navigation).queryByRole('link', { name: 'О нас' })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole('link', { name: 'Регистрация' })).toBeInTheDocument();
  });

});

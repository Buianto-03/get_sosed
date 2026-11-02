import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { MobileNavigation } from './MobileNavigation';

function CurrentPath(): JSX.Element {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

describe('MobileNavigation', () => {
  it('marks the active section and opens its target', () => {
    render(
      <MemoryRouter initialEntries={['/listings/42']}>
        <MobileNavigation items={[
          { id: 'home', label: 'Главная', to: '/', activePaths: ['/'], icon: <span aria-hidden="true">⌂</span> },
          { id: 'search', label: 'Поиск', to: '/listings', activePaths: ['/listings'], icon: <span aria-hidden="true">⌕</span> },
        ]} />
        <CurrentPath />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Поиск' })).toHaveAttribute('aria-current', 'page');
    fireEvent.click(screen.getByRole('link', { name: 'Главная' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/');
  });

  it('does not mark search as active on the listing-create subroute', () => {
    render(
      <MemoryRouter initialEntries={['/listings/new']}>
        <MobileNavigation items={[
          { id: 'search', label: 'Поиск', to: '/listings', activePaths: ['/listings'], excludePaths: ['/listings/new'], icon: <span aria-hidden="true">⌕</span> },
          { id: 'post', label: 'Подать', to: '/listings/new', activePaths: ['/listings/new'], icon: <span aria-hidden="true">+</span> },
        ]} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Поиск' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Подать' })).toHaveAttribute('aria-current', 'page');
  });
});

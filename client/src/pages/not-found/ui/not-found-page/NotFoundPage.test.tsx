import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { NotFoundPage } from './NotFoundPage';

function CurrentPath(): JSX.Element {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

describe('NotFoundPage', () => {
  it('keeps the unknown address until the user selects a destination', () => {
    render(
      <MemoryRouter initialEntries={['/unknown/path']}>
        <NotFoundPage />
        <CurrentPath />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('current-path')).toHaveTextContent('/unknown/path');
    fireEvent.click(screen.getByRole('link', { name: 'К поиску' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/listings');
  });
});

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Link, MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SiteContent } from './SiteContent';

describe('SiteContent route focus', () => {
  it('waits for an asynchronously rendered heading and focuses it only once', async () => {
    const { rerender } = render(
      <MemoryRouter>
        <SiteContent id="content"><main><p role="status">Загрузка</p></main></SiteContent>
      </MemoryRouter>,
    );

    rerender(
      <MemoryRouter>
        <SiteContent id="content"><main><h1>Объявления</h1><input aria-label="Поиск" /></main></SiteContent>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Объявления' })).toHaveFocus());

    const search = screen.getByRole('textbox', { name: 'Поиск' });
    search.focus();
    rerender(
      <MemoryRouter>
        <SiteContent id="content"><main><h1>Результаты поиска</h1><input aria-label="Поиск" /></main></SiteContent>
      </MemoryRouter>,
    );
    await waitFor(() => expect(search).toHaveFocus());
  });

  it('preserves focus when only the search parameters change', () => {
    render(
      <MemoryRouter initialEntries={['/listings']}>
        <SiteContent id="content">
          <main><h1>Объявления</h1><Link to="?city=Казань">Выбрать Казань</Link></main>
        </SiteContent>
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'Выбрать Казань' });
    link.focus();
    fireEvent.click(link);
    expect(link).toHaveFocus();
  });
});

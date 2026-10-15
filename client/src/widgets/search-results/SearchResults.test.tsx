import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SearchResults, SearchResultsState, type SearchResultListing } from './SearchResults';

const listings: SearchResultListing[] = [
  { id: 'one', listing: { title: 'Первая квартира', price: 25000 }, saved: false },
  { id: 'two', listing: { title: 'Вторая квартира', price: 30000 }, saved: true },
];

function renderResults(state = SearchResultsState.Ready, items = listings): {
  onOpenListing: ReturnType<typeof vi.fn>;
  onSaveListing: ReturnType<typeof vi.fn>;
  onResetFilters: ReturnType<typeof vi.fn>;
  onRetry: ReturnType<typeof vi.fn>;
} {
  const onOpenListing = vi.fn();
  const onSaveListing = vi.fn();
  const onResetFilters = vi.fn();
  const onRetry = vi.fn();
  render(
    <SearchResults
      listings={items}
      state={state}
      onOpenListing={onOpenListing}
      onSaveListing={onSaveListing}
      onResetFilters={onResetFilters}
      onRetry={onRetry}
    />,
  );
  return { onOpenListing, onSaveListing, onResetFilters, onRetry };
}

describe('SearchResults', () => {
  it('shows results, map and controlled listing actions', () => {
    const actions = renderResults();
    expect(screen.getByRole('status')).toHaveTextContent('2 варианта');
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByText('Карта объявлений')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Сохранить объявление' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Подробнее' })[0]);
    expect(actions.onSaveListing).toHaveBeenCalledWith('one', true);
    expect(actions.onOpenListing).toHaveBeenCalledWith('one');
  });

  it('shows loading without cards or map', () => {
    renderResults(SearchResultsState.Loading);
    expect(screen.getByRole('status', { name: 'Загрузка объявлений' })).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.queryByText('Карта объявлений')).not.toBeInTheDocument();
  });

  it('shows empty state and resets filters', () => {
    const actions = renderResults(SearchResultsState.Ready, []);
    expect(screen.getByText('0 вариантов')).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.queryByText('Карта объявлений')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));
    expect(actions.onResetFilters).toHaveBeenCalledOnce();
  });

  it('shows error state and retries', () => {
    const actions = renderResults(SearchResultsState.Error);
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить объявления');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.queryByText('Карта объявлений')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(actions.onRetry).toHaveBeenCalledOnce();
  });
});

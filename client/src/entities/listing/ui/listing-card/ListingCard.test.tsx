import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ListingCard, ListingCardVariant, type ListingCardData } from './ListingCard';

const listing: ListingCardData = {
  title: 'Светлая квартира рядом с парком',
  price: 25000,
  imageUrl: '/images/2pic.jpg',
  imageAlt: 'Гостиная в квартире',
  city: 'Москва',
  district: 'Аэропорт',
  metro: 'м. Сокол',
  tags: ['Для некурящих', 'Тихие вечера'],
};

function CardHarness({ data, onOpen }: { data: ListingCardData; onOpen: () => void }): JSX.Element {
  const [saved, setSaved] = useState(false);
  return (
    <ListingCard
      listing={data}
      variant={ListingCardVariant.Home}
      saved={saved}
      onSavedChange={setSaved}
      onOpen={onOpen}
    />
  );
}

describe('ListingCard', () => {
  it('disables saving while pending and enables it after completion', () => {
    const onSavedChange = vi.fn();
    const { rerender } = render(<ListingCard listing={listing} saved={false} onSavedChange={onSavedChange} onOpen={vi.fn()} />);
    const save = screen.getByRole('button', { name: 'Сохранить объявление' });
    rerender(<ListingCard listing={listing} saved={false} saveDisabled onSavedChange={onSavedChange} onOpen={vi.fn()} />);
    expect(save).toBeDisabled();
    fireEvent.click(save);
    expect(onSavedChange).not.toHaveBeenCalled();
    rerender(<ListingCard listing={listing} saved onSavedChange={onSavedChange} onOpen={vi.fn()} />);
    expect(save).toBeEnabled();
    expect(save).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows listing details and handles save and open actions', () => {
    const onOpen = vi.fn();
    render(<CardHarness data={listing} onOpen={onOpen} />);

    expect(screen.getByText(/25\s000 ₽/)).toBeInTheDocument();
    expect(screen.getByText('Москва · Аэропорт · м. Сокол')).toBeInTheDocument();
    expect(screen.getByText('Тихие вечера')).toBeInTheDocument();
    expect(screen.getByAltText('Гостиная в квартире 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Сохранить объявление' }));
    expect(screen.getByRole('button', { name: 'Убрать из избранного' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Подробнее' }));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('handles a long title and missing optional fields without invented details', () => {
    const title = 'Очень длинное название объявления о светлой квартире рядом с парком и несколькими станциями метро';
    render(<CardHarness data={{ title, price: 22000 }} onOpen={vi.fn()} />);

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByText('Фото не добавлено')).toBeInTheDocument();
    expect(screen.queryByLabelText('Условия')).not.toBeInTheDocument();
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
  });

  it('switches photos without opening the listing and opens it from the photo', () => {
    const onOpen = vi.fn();
    render(
      <CardHarness
        data={{ ...listing, photos: ['/first.webp', '/second.webp', '/third.webp'] }}
        onOpen={onOpen}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Следующее фото' }));
    expect(screen.getByRole('img')).toHaveAttribute('src', '/second.webp');
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(onOpen).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: `Открыть объявление: ${listing.title}` }));
    expect(onOpen).toHaveBeenCalledOnce();
  });
});

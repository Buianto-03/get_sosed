import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ListingHeader } from './ListingHeader';

describe('ListingHeader', () => {
  it('shows title and photos and returns to search', () => {
    const onBack = vi.fn();
    render(
      <ListingHeader
        title="Светлая квартира рядом с парком"
        photos={[
          { id: 'one', src: '/one.jpg', alt: 'Гостиная' },
          { id: 'two', src: '/two.jpg', alt: 'Кухня' },
          { id: 'three', src: '/three.jpg', alt: 'Спальня' },
        ]}
        onBack={onBack}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Светлая квартира рядом с парком' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Открыть фото/ })).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'К результатам' }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('shows the existing gallery fallback when no photos are available', () => {
    render(<ListingHeader title="Квартира без фото" photos={[]} onBack={() => {}} />);
    expect(screen.getByText('Фотографии не добавлены')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Открыть фото/ })).not.toBeInTheDocument();
  });
});

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ListingGallery } from './ListingGallery';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ListingGallery motion preference', () => {
  it('handles no photos and a single photo without redundant navigation', () => {
    const { rerender } = render(<ListingGallery photos={[]} />);
    expect(screen.getByText('Фотографии не добавлены')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    rerender(<ListingGallery photos={[{ id: 'one', src: '/one.jpg', alt: 'Комната' }]} />);
    const opener = screen.getByRole('button', { name: 'Открыть фото 1 из 1' });
    opener.focus();
    fireEvent.click(opener);
    expect(screen.getByRole('dialog', { name: 'Фото 1 из 1' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Следующее фото' })).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(opener).toHaveFocus();
  });

  it('keeps photo navigation and respects a preference changed after mounting', () => {
    let reducedMotion = false;
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reducedMotion })));
    render(
      <ListingGallery
        photos={[
          { id: 'one', src: '/one.jpg', alt: 'Комната' },
          { id: 'two', src: '/two.jpg', alt: 'Кухня' },
          { id: 'three', src: '/three.jpg', alt: 'Коридор' },
        ]}
      />,
    );
    const secondScroll = vi.fn();
    const thirdScroll = vi.fn();
    screen.getByRole('button', { name: 'Открыть фото 2 из 3' }).scrollIntoView = secondScroll;
    screen.getByRole('button', { name: 'Открыть фото 3 из 3' }).scrollIntoView = thirdScroll;

    fireEvent.click(screen.getByRole('button', { name: 'Следующее фото' }));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(secondScroll).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }));

    reducedMotion = true;
    fireEvent.click(screen.getByRole('button', { name: 'Следующее фото' }));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(thirdScroll).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }));
  });
});

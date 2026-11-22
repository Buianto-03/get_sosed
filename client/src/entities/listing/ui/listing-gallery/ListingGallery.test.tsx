import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ListingGallery } from './ListingGallery';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ListingGallery motion preference', () => {
  it('requests only visible tiles and still opens an unloaded photo in the lightbox', () => {
    let notify: IntersectionObserverCallback;
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn((callback: IntersectionObserverCallback) => {
        notify = callback;
        return { observe, disconnect };
      }),
    );
    const photos = Array.from({ length: 6 }, (_, index) => ({
      id: String(index),
      src: `/photo-${index}.webp`,
      alt: `Фото ${index}`,
    }));
    const { container, unmount } = render(<ListingGallery photos={photos} />);
    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(observe).toHaveBeenCalledTimes(6);

    const second = screen.getByRole('button', { name: 'Открыть фото 2 из 6' });
    act(() =>
      notify(
        [
          {
            target: second,
            isIntersecting: true,
            intersectionRect: new DOMRect(0, 0, 200, 200),
            boundingClientRect: second.getBoundingClientRect(),
            intersectionRatio: 1,
            rootBounds: null,
            time: 0,
          },
        ],
        {} as IntersectionObserver,
      ),
    );
    expect(container.querySelectorAll('img')).toHaveLength(2);
    expect(container.querySelector('img[src="/photo-5.webp"]')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Открыть фото 6 из 6' }));
    expect(within(screen.getByRole('dialog')).getByRole('img')).toHaveAttribute(
      'src',
      '/photo-5.webp',
    );
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });

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
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: reducedMotion })),
    );
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

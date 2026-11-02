import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Carousel } from './Carousel';

const photos = ['/one.webp', '/two.webp', '/three.webp', '/four.webp', '/five.webp'];

describe('Carousel', () => {
  it('handles an empty collection and a single photo without controls', () => {
    const { rerender } = render(<Carousel photos={[]} />);
    expect(screen.getByText('Фото не добавлено')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(<Carousel photos={['/one.webp']} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', '/one.webp');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('navigates within bounds without opening the enclosing card', () => {
    const onParentClick = vi.fn();
    const onOpen = vi.fn();
    render(
      // A wrapper observes bubbling without introducing a nested button.
      <div onClick={onParentClick} role="presentation">
        <Carousel photos={photos} onOpen={onOpen} />
      </div>,
    );
    const previous = screen.getByRole('button', { name: 'Предыдущее фото' });
    const next = screen.getByRole('button', { name: 'Следующее фото' });
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(previous);
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
    fireEvent.click(next);
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', '/two.webp');
    expect(onParentClick).not.toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Открыть объявление/ }));
    expect(onOpen).toHaveBeenCalledOnce();
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it('loads neighbors on demand and retains visited photos after keyboard navigation', () => {
    const { container } = render(<Carousel photos={photos} />);
    const next = screen.getByRole('button', { name: 'Следующее фото' });
    expect(container.querySelectorAll('img')).toHaveLength(2);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Следующее фото' }), { key: 'End' });
    expect(screen.getByText('5 / 5')).toBeInTheDocument();
    expect(container.querySelectorAll('img')).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Следующее фото' })).toHaveAttribute('aria-disabled', 'true');
    fireEvent.keyDown(next, { key: 'ArrowRight' });
    expect(screen.getByText('5 / 5')).toBeInTheDocument();
    fireEvent.keyDown(next, { key: 'Home' });
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
    expect(container.querySelectorAll('img')).toHaveLength(4);
    fireEvent.keyDown(next, { key: 'ArrowRight' });
    fireEvent.keyDown(next, { key: 'ArrowLeft' });
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
  });

  it('resets when sources change and handles failed images', () => {
    const { rerender } = render(<Carousel photos={photos} />);
    fireEvent.click(screen.getByRole('button', { name: 'Следующее фото' }));
    rerender(<Carousel photos={['/new.webp']} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', '/new.webp');
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByText('Не удалось загрузить фото')).toBeInTheDocument();
    rerender(<Carousel photos={['/other.webp']} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', '/other.webp');
  });
});

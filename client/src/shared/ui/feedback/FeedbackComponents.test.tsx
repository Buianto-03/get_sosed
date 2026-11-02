import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Alert, AlertVariant } from './Alert';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';
import { Spinner, SpinnerSize } from './Spinner';

describe('feedback components', () => {
  it('exposes loading status and keeps skeleton decorative', () => {
    const { container } = render(
      <>
        <Spinner size={SpinnerSize.Lg} label="Загружаем объявления" />
        <Skeleton />
      </>,
    );
    expect(screen.getByRole('status', { name: 'Загружаем объявления' })).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('announces an error alert and renders an empty state action', () => {
    render(
      <>
        <Alert variant={AlertVariant.Error} title="Ошибка">Не удалось загрузить объявления</Alert>
        <EmptyState
          title="Ничего не найдено"
          description="Измените фильтры"
          action={<button type="button">Сбросить фильтры</button>}
        />
      </>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить объявления');
    expect(screen.getByRole('heading', { name: 'Ничего не найдено' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сбросить фильтры' })).toBeInTheDocument();
  });
});

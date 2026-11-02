import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Avatar, getInitials } from './avatar/Avatar';
import { AvatarGroup } from './avatar/AvatarGroup';
import { Badge, BadgeVariant } from './badge/Badge';
import { Chip } from './chip/Chip';

describe('small display components', () => {
  it('renders badge variants and calls the chip remove handler', () => {
    const onRemove = vi.fn();
    render(
      <>
        <Badge variant={BadgeVariant.Success}>Проверено</Badge>
        <Chip label="Можно с питомцами" onRemove={onRemove} />
      </>,
    );

    expect(screen.getByText('Проверено')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Убрать «Можно с питомцами»' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('shows initials and announces the number of hidden group members', () => {
    render(
      <>
        <Avatar name="Анна Смирнова" />
        <AvatarGroup
          label="Участники"
          max={2}
          avatars={[
            { name: 'Анна Смирнова' },
            { name: 'Михаил Петров' },
            { name: 'София Иванова' },
          ]}
        />
      </>,
    );

    expect(getInitials('Анна Смирнова')).toBe('АС');
    expect(screen.getAllByRole('img', { name: 'Анна Смирнова' })).toHaveLength(2);
    expect(screen.getByRole('group', { name: 'Участники' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Скрыто участников: 1' })).toHaveTextContent('+1');
  });
});

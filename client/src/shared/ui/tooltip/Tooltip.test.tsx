import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from '../button/Button';
import { Tooltip, TooltipPlacement } from './Tooltip';
import { getTooltipPosition } from './helper';

afterEach(() => {
  vi.useRealTimers();
});

describe('Tooltip', () => {
  it('opens on hover in a portal and stays open while the pointer is over the tooltip', () => {
    vi.useFakeTimers();
    render(
      <Tooltip content="Сохранить объявление">
        <button type="button">Избранное</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Избранное' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.mouseEnter(trigger);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.parentElement).toBe(document.body);
    expect(trigger).toHaveAccessibleDescription('Сохранить объявление');

    fireEvent.mouseLeave(trigger);
    fireEvent.mouseEnter(tooltip);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(tooltip).toBeInTheDocument();
    fireEvent.mouseLeave(tooltip);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  it('supports focus, preserves child handlers and descriptions, and dismisses with Escape', () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const onClick = vi.fn();
    render(
      <>
        <span id="existing-hint">Уже доступная подсказка</span>
        <Tooltip content="Дополнительное описание">
          <Button
            aria-describedby="existing-hint"
            onFocus={onFocus}
            onBlur={onBlur}
            onClick={onClick}
          >
            Подробнее
          </Button>
        </Tooltip>
      </>,
    );
    const trigger = screen.getByRole('button', { name: 'Подробнее' });
    act(() => trigger.focus());
    expect(onFocus).toHaveBeenCalledOnce();
    expect(trigger).toHaveAccessibleDescription('Уже доступная подсказка Дополнительное описание');
    fireEvent.click(trigger);
    expect(onClick).toHaveBeenCalledOnce();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-describedby', 'existing-hint');

    act(() => trigger.blur());
    expect(onBlur).toHaveBeenCalledOnce();
    act(() => trigger.focus());
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    act(() => trigger.blur());
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('keeps a focused tooltip open after the pointer leaves', () => {
    vi.useFakeTimers();
    render(
      <Tooltip content="Описание">
        <button type="button">Действие</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button');
    act(() => trigger.focus());
    fireEvent.mouseEnter(trigger);
    fireEvent.mouseLeave(trigger);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    act(() => trigger.blur());
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('does not reopen after Escape until hover ends', () => {
    vi.useFakeTimers();
    render(
      <Tooltip content="Описание">
        <button type="button">Действие</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button');
    fireEvent.mouseEnter(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.mouseEnter(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.mouseLeave(trigger);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.mouseEnter(trigger);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('suppresses disabled and empty tooltips and removes a visible tooltip when disabled', () => {
    const { rerender } = render(
      <Tooltip content="Описание">
        <button type="button">Действие</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button');
    act(() => trigger.focus());
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    rerender(
      <Tooltip content="Описание" disabled>
        <button type="button">Действие</button>
      </Tooltip>,
    );
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(trigger).not.toHaveAttribute('aria-describedby');
    rerender(
      <Tooltip content="  ">
        <button type="button">Действие</button>
      </Tooltip>,
    );
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('cleans up pending dismissal on unmount', () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <Tooltip content="Описание">
        <button type="button">Действие</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(screen.getByRole('button'));
    fireEvent.mouseLeave(screen.getByRole('button'));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});

describe('tooltip positioning', () => {
  const trigger = new DOMRect(200, 200, 40, 40);
  const tooltip = new DOMRect(0, 0, 100, 40);

  it.each([
    [TooltipPlacement.Top, { top: 152, left: 170 }],
    [TooltipPlacement.Bottom, { top: 248, left: 170 }],
    [TooltipPlacement.Left, { top: 200, left: 92 }],
    [TooltipPlacement.Right, { top: 200, left: 248 }],
  ])('places the tooltip on the %s side', (placement, position) => {
    expect(getTooltipPosition(trigger, tooltip, placement, 800, 600)).toEqual(position);
  });

  it('flips near viewport edges and clamps the tooltip to the viewport', () => {
    expect(
      getTooltipPosition(new DOMRect(0, 0, 40, 40), tooltip, TooltipPlacement.Top, 320, 600),
    ).toEqual({ top: 48, left: 8 });
    expect(
      getTooltipPosition(new DOMRect(280, 200, 40, 40), tooltip, TooltipPlacement.Right, 320, 600),
    ).toEqual({ top: 200, left: 172 });
  });
});

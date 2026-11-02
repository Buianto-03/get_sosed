import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';
import { Drawer } from './Drawer';
import { Menu } from './Menu';

function ModalHarness({ onClose }: { onClose: () => void }): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Открыть</button>
      <Modal open={open} onClose={() => { onClose(); setOpen(false); }} title="Заголовок">
        <button type="button">Действие</button>
      </Modal>
    </>
  );
}

describe('overlay components', () => {
  it('does not reset dialog focus when its callback or content changes', () => {
    const { rerender, unmount } = render(
      <Modal open onClose={() => undefined} title="Фото 1"><button type="button">Следующее</button></Modal>,
    );
    const action = screen.getByRole('button', { name: 'Следующее' });
    action.focus();
    rerender(<Modal open onClose={() => undefined} title="Фото 2"><button type="button">Следующее</button></Modal>);
    expect(action).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('makes the background inert and uses the page heading when the opener is removed', () => {
    const { rerender } = render(<><main><h1>Жильё</h1><button type="button">Открыть фото</button></main><Modal open={false} onClose={() => undefined} title="Фото">Снимок</Modal></>);
    screen.getByRole('button').focus();
    rerender(<><main><h1>Жильё</h1></main><Modal open onClose={() => undefined} title="Фото">Снимок</Modal></>);
    expect(screen.getByRole('main').parentElement?.inert).toBe(true);
    rerender(<><main><h1>Жильё</h1></main><Modal open={false} onClose={() => undefined} title="Фото">Снимок</Modal></>);
    expect(screen.getByRole('heading', { name: 'Жильё' })).toHaveFocus();
    expect(screen.getByRole('main').parentElement?.inert).toBeFalsy();
  });

  it('closes a menu on Tab and allows native traversal from its trigger', () => {
    render(<Menu label="Меню" trigger="Меню" items={[{ label: 'Профиль', onSelect: vi.fn() }]} />);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Tab' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Меню' })).toHaveFocus();
  });

  it('closes modal on Escape, locks scroll, and restores focus', () => {
    const onClose = vi.fn();
    render(<ModalHarness onClose={onClose} />);
    const opener = screen.getByRole('button', { name: 'Открыть' });
    opener.focus();
    fireEvent.click(opener);
    expect(document.body.style.overflow).toBe('hidden');
    expect(screen.getByRole('dialog', { name: 'Заголовок' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    expect(document.body.style.overflow).toBe('');
    expect(screen.getByRole('button', { name: 'Открыть' })).toHaveFocus();
  });

  it('closes a drawer when the backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <div id="content-frame">
        <Drawer open onClose={onClose} title="Фильтры">
          <button type="button">Действие</button>
        </Drawer>
      </div>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Фильтры' });
    const backdrop = dialog.parentElement as HTMLElement;
    expect(backdrop.parentElement).toBe(document.body);
    expect(dialog).not.toHaveAttribute('style');

    const closeButton = screen.getByRole('button', { name: 'Закрыть' });
    const actionButton = screen.getByRole('button', { name: 'Действие' });
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(actionButton).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(closeButton).toHaveFocus();

    fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('moves through menu items and restores focus after selection', () => {
    const onSelect = vi.fn();
    render(
      <Menu
        label="Действия"
        trigger="Открыть меню"
        items={[
          { label: 'Изменить', onSelect },
          { label: 'Удалить', onSelect, disabled: true },
          { label: 'Скрыть', onSelect },
        ]}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Действия' });
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
    expect(screen.getByRole('menuitem', { name: 'Скрыть' })).toHaveFocus();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Скрыть' }));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

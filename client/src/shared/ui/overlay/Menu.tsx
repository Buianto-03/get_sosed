import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './Menu.module.scss';

export enum MenuPlacement {
  Start = 'start',
  End = 'end',
}

export type MenuItem = {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
};

export type MenuProps = {
  label: string;
  trigger: ReactNode;
  items: MenuItem[];
  placement?: MenuPlacement;
  className?: string;
};

export function Menu({
  label,
  trigger,
  items,
  placement = MenuPlacement.End,
  className,
}: MenuProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const enabledItems = (): HTMLButtonElement[] =>
    Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [],
    );

  useEffect(() => {
    if (!open) return undefined;
    enabledItems()[0]?.focus();
    const handlePointerDown = (event: MouseEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const enabled = enabledItems();
    const currentIndex = enabled.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = (currentIndex + direction + enabled.length) % enabled.length;
      enabled[nextIndex]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      enabled[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      enabled[enabled.length - 1]?.focus();
    }
  };

  return (
    <div ref={rootRef} className={[styles.root, className].filter(Boolean).join(' ')}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {trigger}
      </button>
      {open && (
        <div
          ref={menuRef}
          className={[styles.menu, styles[placement]].join(' ')}
          role="menu"
          aria-label={label}
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
        >
          {items.map((item) => (
            <button
              key={item.label}
              className={styles.item}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                item.onSelect();
                setOpen(false);
                triggerRef.current?.focus();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

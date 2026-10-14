import React, { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { LuX } from 'react-icons/lu';
import styles from './Dialog.module.scss';

export enum DialogSize {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

export enum DialogKind {
  Modal = 'modal',
  Drawer = 'drawer',
}

export enum DialogSide {
  Left = 'left',
  Right = 'right',
}

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: DialogSize;
  kind?: DialogKind;
  side?: DialogSide;
  closeLabel?: string;
  className?: string;
};

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function Dialog({
  open,
  onClose,
  title,
  children,
  size = DialogSize.Md,
  kind = DialogKind.Modal,
  side = DialogSide.Right,
  closeLabel = 'Закрыть',
  className,
}: DialogProps): JSX.Element | null {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const firstFocusable = panel?.querySelector<HTMLElement>(focusableSelector);
    (firstFocusable ?? panel)?.focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panel) return;

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === panel)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const panelClasses = [
    styles.panel,
    styles[size],
    styles[kind],
    kind === DialogKind.Drawer && styles[side],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return createPortal(
    <div
      className={[styles.backdrop, kind === DialogKind.Drawer && styles.drawerBackdrop]
        .filter(Boolean)
        .join(' ')}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={panelRef}
        className={panelClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            className={styles.closeButton}
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <LuX aria-hidden="true" />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </section>
    </div>,
    document.body,
  );
}

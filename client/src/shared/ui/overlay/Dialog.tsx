import React, { useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { LuX } from 'react-icons/lu';
import { useDialogBehavior } from './use-dialog-behavior';
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

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: DialogSize;
  kind?: DialogKind;
  side?: DialogSide;
  closeLabel?: string;
  className?: string;
}

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
  const panelRef = useDialogBehavior({ open, onClose });

  if (!open || typeof document === 'undefined') {
    return null;
  }

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
        if (event.target === event.currentTarget) {
          onClose();
        }
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

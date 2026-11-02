import { useEffect, useRef, type RefObject } from 'react';
import { getDialogFocusable, lockDialogBackground, restoreDialogFocus } from './helper';

interface UseDialogBehaviorOptions {
  open: boolean;
  onClose: () => void;
}

export function useDialogBehavior({ open, onClose }: UseDialogBehaviorOptions): RefObject<HTMLElement> {
  const panelRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const unlockBackground = lockDialogBackground(panel);
    const firstFocusable = panel ? getDialogFocusable(panel)[0] : undefined;
    (firstFocusable ?? panel)?.focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !panel) {
        return;
      }

      const focusable = getDialogFocusable(panel);
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

    const keepFocusInside = (event: FocusEvent): void => {
      if (panel && !panel.contains(event.target as Node)) {
        panel.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', keepFocusInside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', keepFocusInside);
      unlockBackground();
      restoreDialogFocus(previouslyFocused);
    };
  }, [open]);

  return panelRef;
}

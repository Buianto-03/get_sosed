import { useLayoutEffect, useRef } from 'react';

type FocusTargetResolver = () => HTMLElement | null | undefined;

// The caller updates the UI; a request waits for a commit where its target is available.
export function useFocusAfterUpdate(): (resolveTarget: FocusTargetResolver) => void {
  const pendingFocus = useRef<FocusTargetResolver | null>(null);

  useLayoutEffect(() => {
    const target = pendingFocus.current?.();
    if (target) {
      pendingFocus.current = null;
      target.focus();
    }
  });

  return (resolveTarget) => {
    pendingFocus.current = resolveTarget;
  };
}

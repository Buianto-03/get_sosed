const focusableSelector = [
  'a[href]', 'button', 'input', 'select', 'textarea', 'summary', '[tabindex]',
].join(',');

export function isVisible(element: HTMLElement): boolean {
  let ancestor: HTMLElement | null = element;
  while (ancestor) {
    const style = getComputedStyle(ancestor);
    if (ancestor.hidden || ancestor.inert || style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }
    if (ancestor instanceof HTMLDetailsElement && !ancestor.open && !ancestor.querySelector('summary')?.contains(element)) {
      return false;
    }
    ancestor = ancestor.parentElement;
  }
  return true;
}

export function getDialogFocusable(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => element.tabIndex >= 0 && !element.matches(':disabled') && element.getAttribute('aria-hidden') !== 'true' && isVisible(element),
  );
}

export function lockDialogBackground(panel: HTMLElement | null): () => void {
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const background = Array.from(document.body.children).filter(
    (element): element is HTMLElement => element instanceof HTMLElement && !element.contains(panel),
  );
  const inertStates = background.map((element) => element.inert);
  background.forEach((element) => { element.inert = true; });

  return () => {
    document.body.style.overflow = previousOverflow;
    background.forEach((element, index) => { element.inert = inertStates[index]; });
  };
}

export function restoreDialogFocus(previouslyFocused: HTMLElement | null): void {
  if (previouslyFocused?.isConnected && previouslyFocused !== document.body && isVisible(previouslyFocused)) {
    previouslyFocused.focus();
    return;
  }

  const fallback = document.querySelector<HTMLElement>('main h1')
    ?? document.querySelector<HTMLElement>('main, [data-route-content]');
  if (fallback) {
    fallback.setAttribute('tabindex', '-1');
    fallback.focus();
  }
}

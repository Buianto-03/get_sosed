export function getCollectionFocusTarget(
  section: HTMLElement | null,
  previouslyFocused: HTMLElement,
): HTMLElement | null | undefined {
  if (previouslyFocused.isConnected || document.activeElement !== document.body) {
    return null;
  }

  const heading = section?.querySelector('h2');
  if (heading) {
    heading.tabIndex = -1;
  }
  return heading;
}

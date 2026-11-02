export function focusHeading(content: HTMLElement): boolean {
  const heading = content.querySelector<HTMLElement>('h1');
  if (!heading) {
    return false;
  }

  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
  return true;
}

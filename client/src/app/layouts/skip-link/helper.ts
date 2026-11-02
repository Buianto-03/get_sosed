export function focusContent(targetId: string): void {
  const content = document.getElementById(targetId);
  const target = content?.querySelector<HTMLElement>('main') ?? content;
  if (target) {
    target.tabIndex = -1;
    target.focus();
  }
}

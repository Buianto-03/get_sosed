export interface ScrollAnchor {
  row: HTMLElement;
  offset: number;
}

export function getVisibleAnchor(list: HTMLElement): ScrollAnchor | null {
  const { top, bottom } = list.getBoundingClientRect();
  const { children } = list;
  let first = children[0]?.hasAttribute('data-message-id') ? 0 : 1;
  let last = children.length;
  while (first < last) {
    const middle = Math.floor((first + last) / 2);
    if (children[middle].getBoundingClientRect().bottom <= top) {
      first = middle + 1;
    } else {
      last = middle;
    }
  }
  const row = children[first];
  if (!(row instanceof HTMLElement)) {
    return null;
  }
  const rowTop = row.getBoundingClientRect().top;
  return rowTop < bottom ? { row, offset: rowTop - top } : null;
}

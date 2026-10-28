export enum TooltipPlacement {
  Top = 'top',
  Bottom = 'bottom',
  Left = 'left',
  Right = 'right',
}

export interface TooltipPosition {
  top: number;
  left: number;
}

export function getTooltipPosition(
  trigger: DOMRect,
  tooltip: DOMRect,
  placement: TooltipPlacement,
  viewportWidth: number,
  viewportHeight: number,
): TooltipPosition {
  const gap = 8;
  const space = {
    [TooltipPlacement.Top]: trigger.top,
    [TooltipPlacement.Bottom]: viewportHeight - trigger.bottom,
    [TooltipPlacement.Left]: trigger.left,
    [TooltipPlacement.Right]: viewportWidth - trigger.right,
  };
  const opposite = {
    [TooltipPlacement.Top]: TooltipPlacement.Bottom,
    [TooltipPlacement.Bottom]: TooltipPlacement.Top,
    [TooltipPlacement.Left]: TooltipPlacement.Right,
    [TooltipPlacement.Right]: TooltipPlacement.Left,
  };
  const vertical = placement === TooltipPlacement.Top || placement === TooltipPlacement.Bottom;
  const requiredSpace = (vertical ? tooltip.height : tooltip.width) + gap * 2;
  const side =
    space[placement] < requiredSpace && space[opposite[placement]] > space[placement]
      ? opposite[placement]
      : placement;
  const centerTop = trigger.top + (trigger.height - tooltip.height) / 2;
  const centerLeft = trigger.left + (trigger.width - tooltip.width) / 2;
  const positions: Record<TooltipPlacement, TooltipPosition> = {
    [TooltipPlacement.Top]: { top: trigger.top - tooltip.height - gap, left: centerLeft },
    [TooltipPlacement.Bottom]: { top: trigger.bottom + gap, left: centerLeft },
    [TooltipPlacement.Left]: { top: centerTop, left: trigger.left - tooltip.width - gap },
    [TooltipPlacement.Right]: { top: centerTop, left: trigger.right + gap },
  };
  const { top, left } = positions[side];

  return {
    top: Math.max(gap, Math.min(top, viewportHeight - tooltip.height - gap)),
    left: Math.max(gap, Math.min(left, viewportWidth - tooltip.width - gap)),
  };
}

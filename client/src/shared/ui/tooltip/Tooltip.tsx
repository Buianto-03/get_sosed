import React, {
  cloneElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
} from 'react';
import { createPortal } from 'react-dom';
import { getTooltipPosition, TooltipPlacement, type TooltipPosition } from './helper';
import styles from './Tooltip.module.scss';

export { TooltipPlacement } from './helper';

export interface TooltipProps {
  content: string;
  children: ReactElement<HTMLAttributes<HTMLElement>>;
  placement?: TooltipPlacement;
  disabled?: boolean;
  className?: string;
}

export function Tooltip({
  content,
  children,
  placement = TooltipPlacement.Top,
  disabled = false,
  className,
}: TooltipProps): JSX.Element {
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const open = !disabled && Boolean(content.trim()) && (hovered || focused) && !dismissed;

  const handleMouseEnter = (): void => {
    clearTimeout(closeTimer.current);
    setHovered(true);
  };

  const handleMouseLeave = (): void => {
    clearTimeout(closeTimer.current);
    // Allow the pointer to cross the gap between the trigger and the tooltip.
    closeTimer.current = setTimeout(() => setHovered(false), 100);
  };

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!hovered && !focused) {
      setDismissed(false);
    }
  }, [hovered, focused]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setDismissed(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      return undefined;
    }
    const updatePosition = (): void => {
      if (triggerRef.current && tooltipRef.current) {
        setPosition(
          getTooltipPosition(
            triggerRef.current.getBoundingClientRect(),
            tooltipRef.current.getBoundingClientRect(),
            placement,
            window.innerWidth,
            window.innerHeight,
          ),
        );
      }
    };
    updatePosition();
    const observer =
      typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(updatePosition);
    if (triggerRef.current && tooltipRef.current) {
      observer?.observe(triggerRef.current);
      observer?.observe(tooltipRef.current);
    }
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, placement, content]);

  return (
    <span
      ref={triggerRef}
      className={[styles.tooltip, className].filter(Boolean).join(' ')}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {cloneElement(children, {
        'aria-describedby':
          [children.props['aria-describedby'], open ? id : undefined].filter(Boolean).join(' ') ||
          undefined,
        onFocus: (event: React.FocusEvent<HTMLElement>) => {
          children.props.onFocus?.(event);
          setFocused(true);
        },
        onBlur: (event: React.FocusEvent<HTMLElement>) => {
          children.props.onBlur?.(event);
          setFocused(false);
        },
      })}
      {open &&
        createPortal(
          <span
            ref={tooltipRef}
            id={id}
            role="tooltip"
            className={styles.tooltip__content}
            style={{
              top: position?.top,
              left: position?.left,
              visibility: position ? 'visible' : 'hidden',
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {content}
          </span>,
          document.body,
        )}
    </span>
  );
}

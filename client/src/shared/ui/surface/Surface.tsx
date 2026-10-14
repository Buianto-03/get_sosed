import React, { type ElementType, type ReactNode } from 'react';
import styles from './Surface.module.scss';

export enum SurfaceElement {
  Div = 'div',
  Section = 'section',
  Article = 'article',
}

export enum SurfaceTone {
  Default = 'default',
  Soft = 'soft',
}

export enum SurfacePadding {
  None = 'none',
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

export type SurfaceProps = {
  as?: SurfaceElement;
  tone?: SurfaceTone;
  padding?: SurfacePadding;
  children: ReactNode;
  className?: string;
};

export function Surface({
  as = SurfaceElement.Div,
  tone = SurfaceTone.Default,
  padding = SurfacePadding.Md,
  children,
  className,
}: SurfaceProps): JSX.Element {
  const Component = as as ElementType;
  const classes = [styles.surface, styles[tone], styles[padding], className]
    .filter(Boolean)
    .join(' ');

  return <Component className={classes}>{children}</Component>;
}

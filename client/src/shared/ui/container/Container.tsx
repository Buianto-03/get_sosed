import React, { type ElementType, type ReactNode } from 'react';
import styles from './Container.module.scss';

export enum ContainerElement {
  Div = 'div',
  Section = 'section',
  Main = 'main',
}

export enum ContainerWidth {
  Content = 'content',
  Wide = 'wide',
}

export type ContainerProps = {
  as?: ContainerElement;
  width?: ContainerWidth;
  children: ReactNode;
  className?: string;
};

export function Container({
  as = ContainerElement.Div,
  width = ContainerWidth.Content,
  children,
  className,
}: ContainerProps): JSX.Element {
  const Component = as as ElementType;
  const classes = [styles.container, styles[width], className].filter(Boolean).join(' ');

  return <Component className={classes}>{children}</Component>;
}

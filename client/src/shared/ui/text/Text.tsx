import React, { type ElementType, type ReactNode } from 'react';
import styles from './Text.module.scss';

export enum TextElement {
  Paragraph = 'p',
  Span = 'span',
  Div = 'div',
}

export enum TextVariant {
  Body = 'body',
  Lead = 'lead',
  Small = 'small',
  Caption = 'caption',
}

export enum TextTone {
  Default = 'default',
  Muted = 'muted',
}

export type TextProps = {
  as?: TextElement;
  variant?: TextVariant;
  tone?: TextTone;
  children: ReactNode;
  className?: string;
};

export function Text({
  as = TextElement.Paragraph,
  variant = TextVariant.Body,
  tone = TextTone.Default,
  children,
  className,
}: TextProps): JSX.Element {
  const Component = as as ElementType;
  const classes = [styles.text, styles[variant], styles[tone], className]
    .filter(Boolean)
    .join(' ');

  return <Component className={classes}>{children}</Component>;
}

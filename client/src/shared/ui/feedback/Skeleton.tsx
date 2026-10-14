import React from 'react';
import styles from './Skeleton.module.scss';

export enum SkeletonShape {
  Text = 'text',
  Rectangle = 'rectangle',
  Circle = 'circle',
}

export type SkeletonProps = {
  shape?: SkeletonShape;
  width?: string | number;
  height?: string | number;
  animated?: boolean;
  className?: string;
};

export function Skeleton({
  shape = SkeletonShape.Rectangle,
  width,
  height,
  animated = true,
  className,
}: SkeletonProps): JSX.Element {
  const style: React.CSSProperties = {
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  };
  return (
    <span
      className={[
        styles.skeleton,
        styles[shape],
        animated && styles.animated,
        className,
      ].filter(Boolean).join(' ')}
      style={style}
      aria-hidden="true"
    />
  );
}

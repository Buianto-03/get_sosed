/* eslint-disable react/jsx-props-no-spreading */
import React, { type ReactNode } from 'react';
import { Dialog, DialogKind, DialogSide, DialogSize } from './Dialog';

export { DialogSide as DrawerSide } from './Dialog';

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: DialogSide;
  closeLabel?: string;
  className?: string;
};

export function Drawer({ side = DialogSide.Right, ...rest }: DrawerProps): JSX.Element | null {
  return <Dialog {...rest} kind={DialogKind.Drawer} size={DialogSize.Lg} side={side} />;
}

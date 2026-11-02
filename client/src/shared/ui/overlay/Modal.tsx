/* eslint-disable react/jsx-props-no-spreading */
import React, { type ReactNode } from 'react';
import { Dialog } from './Dialog';
import type { DialogSize } from './Dialog';

export { DialogSize as ModalSize } from './Dialog';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: DialogSize;
  closeLabel?: string;
  className?: string;
};

export function Modal(props: ModalProps): JSX.Element | null {
  return <Dialog {...props} />;
}

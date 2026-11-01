import React from 'react';
import { focusContent } from './helper';
import styles from './SkipLink.module.scss';

interface SkipLinkProps {
  targetId: string;
}

export function SkipLink({ targetId }: SkipLinkProps): JSX.Element {
  return (
    <a
      className={styles.skip_link}
      href={`#${targetId}`}
      onClick={(event) => {
        event.preventDefault();
        focusContent(targetId);
      }}
    >
      К основному содержимому
    </a>
  );
}

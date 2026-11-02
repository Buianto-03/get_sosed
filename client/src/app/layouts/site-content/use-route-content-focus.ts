import { useEffect, useRef, type RefObject } from 'react';
import { useLocation } from 'react-router-dom';
import { focusHeading } from './helper';

export function useRouteContentFocus(): RefObject<HTMLDivElement> {
  const contentRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const content = contentRef.current;
    if (!content || focusHeading(content)) {
      return undefined;
    }

    const observer = new MutationObserver(() => {
      if (focusHeading(content)) {
        observer.disconnect();
      }
    });
    observer.observe(content, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [pathname]);

  return contentRef;
}

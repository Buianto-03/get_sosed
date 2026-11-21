import React, { Component, createRef, type ReactNode } from 'react';
import { getVisibleAnchor, type ScrollAnchor } from './helper';
import styles from './MessageViewport.module.scss';

interface MessageViewportProps {
  lastOlderPageId?: string | null;
  children: ReactNode;
}

interface ViewportSnapshot {
  anchor: ScrollAnchor | null;
  focusedControl: Element | null;
}

// getSnapshotBeforeUpdate reads the old rows after the user has finished scrolling
// during a request, immediately before React inserts the page into the DOM.
export class MessageViewport extends Component<
  MessageViewportProps,
  object,
  ViewportSnapshot | null
> {
  private list = createRef<HTMLDivElement>();

  private followLatest = true;

  private observer?: ResizeObserver;

  componentDidMount(): void {
    this.followEnd();
    if (typeof ResizeObserver !== 'undefined' && this.list.current) {
      this.observer = new ResizeObserver(() => {
        if (this.followLatest) {
          this.followEnd();
        }
      });
      this.observer.observe(this.list.current);
    }
  }

  getSnapshotBeforeUpdate(previous: MessageViewportProps): ViewportSnapshot | null {
    const list = this.list.current;
    const { lastOlderPageId } = this.props;
    const prepending = previous.lastOlderPageId !== lastOlderPageId;
    if (!list || (!prepending && this.followLatest)) {
      return null;
    }
    return {
      anchor: getVisibleAnchor(list),
      focusedControl: list.contains(document.activeElement) ? document.activeElement : null,
    };
  }

  componentDidUpdate(_: MessageViewportProps, __: object, snapshot: ViewportSnapshot | null): void {
    const list = this.list.current;
    if (snapshot?.focusedControl && !snapshot.focusedControl.isConnected) {
      list?.focus({ preventScroll: true });
    }
    const anchor = snapshot?.anchor;
    if (list && anchor && list.contains(anchor.row)) {
      list.scrollTop +=
        anchor.row.getBoundingClientRect().top - list.getBoundingClientRect().top - anchor.offset;
      this.trackPosition();
    } else if (this.followLatest) {
      this.followEnd();
    }
  }

  componentWillUnmount(): void {
    this.observer?.disconnect();
  }

  followEnd = (): void => {
    this.followLatest = true;
    if (this.list.current) {
      this.list.current.scrollTop = this.list.current.scrollHeight;
    }
  };

  private trackPosition = (): void => {
    const list = this.list.current;
    if (list) {
      this.followLatest = list.scrollHeight - list.clientHeight - list.scrollTop < 8;
    }
  };

  render(): JSX.Element {
    const { children } = this.props;
    return (
      <div
        ref={this.list}
        className={styles.viewport}
        aria-label="Сообщения"
        role="region"
        // Keyboard users scroll history independently of the composer.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        onScroll={this.trackPosition}
      >
        {children}
      </div>
    );
  }
}

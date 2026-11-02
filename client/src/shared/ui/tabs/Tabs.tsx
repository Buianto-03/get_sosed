import React, { type KeyboardEvent } from 'react';
import styles from './Tabs.module.scss';

export enum TabsOrientation {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export type TabOption = {
  id: string;
  label: string;
  disabled?: boolean;
};

export type TabsProps = {
  id: string;
  label: string;
  tabs: TabOption[];
  value: string;
  onValueChange: (value: string) => void;
  orientation?: TabsOrientation;
  className?: string;
};

export function Tabs({
  id,
  label,
  tabs,
  value,
  onValueChange,
  orientation = TabsOrientation.Horizontal,
  className,
}: TabsProps): JSX.Element {
  const enabledTabs = tabs.filter((tab) => !tab.disabled);
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const isForward =
      orientation === TabsOrientation.Horizontal
        ? event.key === 'ArrowRight'
        : event.key === 'ArrowDown';
    const isBackward =
      orientation === TabsOrientation.Horizontal
        ? event.key === 'ArrowLeft'
        : event.key === 'ArrowUp';
    const selectedIndex = enabledTabs.findIndex((tab) => tab.id === value);
    let nextIndex = selectedIndex;

    if (isForward) nextIndex = (selectedIndex + 1) % enabledTabs.length;
    else if (isBackward) nextIndex = (selectedIndex - 1 + enabledTabs.length) % enabledTabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = enabledTabs.length - 1;
    else return;

    event.preventDefault();
    const nextTab = enabledTabs[nextIndex];
    if (!nextTab) return;
    onValueChange(nextTab.id);
    document.getElementById(`${id}-tab-${nextTab.id}`)?.focus();
  };

  return (
    <div
      id={id}
      className={[styles.tabs, styles[orientation], className].filter(Boolean).join(' ')}
      role="tablist"
      aria-label={label}
      aria-orientation={orientation}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          id={`${id}-tab-${tab.id}`}
          className={styles.tab}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          aria-controls={`${id}-panel-${tab.id}`}
          tabIndex={value === tab.id ? 0 : -1}
          disabled={tab.disabled}
          onClick={() => onValueChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

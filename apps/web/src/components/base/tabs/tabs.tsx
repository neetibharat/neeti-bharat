'use client';

import { motion } from 'motion/react';
import { useId, type ReactNode } from 'react';
import { Tab, TabList, TabPanel, Tabs as AriaTabs, type Key } from 'react-aria-components';
import { cx } from '@/lib/utils/cx';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  content: ReactNode;
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  defaultSelectedKey?: T;
  /** Set both of these to control which tab is open from outside, for example to fetch that tab's data. */
  selectedKey?: T;
  onSelectionChange?: (key: T) => void;
  /** Something to keep beside the panels, level with them and below the tab bar. */
  aside?: ReactNode;
  className?: string;
}

/** Tabs with a sliding underline. A panel eases in when it is shown. Motion is off for people who ask for less. */
export function Tabs<T extends string = string>(props: TabsProps<T>) {
  const { tabs, defaultSelectedKey, selectedKey, onSelectionChange, aside, className } = props;
  const underline = useId();
  // Looking the id up keeps the tab type without a cast.
  const handleChange = (key: Key) => {
    const tab = tabs.find((candidate) => candidate.id === key);
    if (tab) onSelectionChange?.(tab.id);
  };

  return (
    <AriaTabs
      defaultSelectedKey={
        selectedKey === undefined ? (defaultSelectedKey ?? tabs[0]?.id) : undefined
      }
      selectedKey={selectedKey}
      onSelectionChange={onSelectionChange ? handleChange : undefined}
      className={cx('flex flex-col gap-4', className)}
    >
      <TabList className="flex gap-1 border-b border-line">
        {tabs.map((tab) => (
          <TabButton key={tab.id} tab={tab} underline={underline} />
        ))}
      </TabList>
      {aside ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            {tabs.map((tab) => (
              <Panel key={tab.id} tab={tab} />
            ))}
          </div>
          {aside}
        </div>
      ) : (
        tabs.map((tab) => <Panel key={tab.id} tab={tab} />)
      )}
    </AriaTabs>
  );
}

/** One tab. The underline belongs to whichever is selected, so it slides between them. */
function TabButton({ tab, underline }: { tab: TabItem; underline: string }) {
  return (
    <Tab
      id={tab.id}
      className={cx(
        'relative cursor-pointer px-3 py-2.5 text-label font-semibold text-fg-muted outline-none',
        'data-[hovered]:text-fg data-[selected]:text-brand',
        'data-[focus-visible]:focus-ring',
      )}
    >
      {({ isSelected }) => (
        <>
          {tab.label}
          {isSelected && (
            <motion.span
              layoutId={underline}
              className="absolute inset-x-0 -bottom-px h-0.5 bg-brand"
              transition={{ type: 'spring', stiffness: 600, damping: 45 }}
            />
          )}
        </>
      )}
    </Tab>
  );
}

/** Only the selected panel is on screen, and it fades up into place when it appears. */
function Panel({ tab }: { tab: TabItem }) {
  return (
    <TabPanel id={tab.id} className="outline-none data-[focus-visible]:focus-ring">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        {tab.content}
      </motion.div>
    </TabPanel>
  );
}

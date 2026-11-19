'use client';

import { LayoutGroup } from 'motion/react';
import { useId, type ReactNode } from 'react';
import { NAV_AREAS } from '@/lib/navigation';
import { Panel } from './panel';
import { Rail } from './rail';
import { useSelectedArea } from './use-selected-area';

export interface SidebarProps {
  isAdmin: boolean;
  /** Shown at the top of the panel, for example the organisation. */
  header: ReactNode;
  /** Only the rail of icons shows. */
  collapsed?: boolean;
  /** Pressing an icon while collapsed opens the sidebar on that area. */
  onExpand?: () => void;
}

/** The slim, two-part sidebar: a rail of icons beside a panel of pages. */
export function Sidebar({ isAdmin, header, collapsed, onExpand }: SidebarProps) {
  const areas = NAV_AREAS.filter((area) => !area.adminOnly || isAdmin);
  const { pathname, selected, select } = useSelectedArea(areas);
  // A group per instance, so the desktop sidebar and the mobile drawer animate on their own.
  const layoutGroup = useId();

  return (
    <LayoutGroup id={layoutGroup}>
      <div className="flex h-full">
        <Rail
          areas={areas}
          selectedId={selected.id}
          onSelect={(id) => {
            select(id);
            onExpand?.();
          }}
        />
        {!collapsed && <Panel area={selected} pathname={pathname} header={header} />}
      </div>
    </LayoutGroup>
  );
}

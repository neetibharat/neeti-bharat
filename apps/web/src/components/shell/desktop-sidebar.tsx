'use client';

import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import type { SessionUser } from '@/lib/session-user';
import { cx } from '@/lib/utils/cx';
import { SidebarContent } from './sidebar-content';
import { useSidebarCollapsed } from './sidebar/use-collapsed';

/** The sidebar on large screens. A button on its edge folds it down to the icons and opens it again. */
export function DesktopSidebar({ user }: { user: SessionUser }) {
  const t = useTranslations('nav');
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const label = t(collapsed ? 'expand' : 'collapse');
  const Chevron = collapsed ? IconChevronRight : IconChevronLeft;

  return (
    <aside
      className={cx(
        'relative sticky top-0 z-20 hidden print:hidden h-screen p-3 transition-[width] duration-200 lg:block',
        collapsed ? 'w-[5.5rem]' : 'w-80',
      )}
    >
      <div className="h-full overflow-hidden rounded-card border border-line/70 bg-surface shadow-card">
        <SidebarContent user={user} collapsed={collapsed} onExpand={() => setCollapsed(false)} />
      </div>
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-1/2 right-3 grid size-6 -translate-y-1/2 translate-x-1/2 cursor-pointer place-items-center rounded-full border border-line bg-surface text-fg-muted shadow-soft transition-colors outline-none hover:bg-surface-muted hover:text-fg focus-visible:focus-ring"
      >
        <Chevron className="size-4" stroke={2} />
      </button>
    </aside>
  );
}

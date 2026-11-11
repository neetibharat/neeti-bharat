'use client';

import type { Icon } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { Badge } from '@/components/base/badge/badge';
import { Link } from '@/i18n/navigation';
import type { NavStatus } from '@/lib/navigation';
import { cx } from '@/lib/utils/cx';

export interface NavItemProps {
  href: string;
  label: string;
  icon?: Icon;
  status: NavStatus;
  active: boolean;
  /** The translated "Soon" tag. */
  soonLabel: string;
  /** Items with the same layoutId share one sliding highlight. */
  layoutId?: string;
}

const base = 'relative flex h-9 items-center gap-3 rounded-control px-3 text-body font-medium';

function ActivePill({ layoutId }: { layoutId: string }) {
  return (
    <motion.span
      layoutId={layoutId}
      className="absolute inset-0 rounded-control bg-brand-soft"
      transition={{ type: 'spring', stiffness: 600, damping: 45 }}
    />
  );
}

function ItemBody({ label, icon: ItemIcon, status, active, soonLabel, layoutId }: NavItemProps) {
  return (
    <>
      {active && layoutId && <ActivePill layoutId={layoutId} />}
      {ItemIcon && <ItemIcon className="relative size-5 shrink-0" stroke={1.75} />}
      <span className="relative truncate">{label}</span>
      {status === 'soon' && <Badge className="relative ml-auto">{soonLabel}</Badge>}
    </>
  );
}

/** One row of the sidebar. Pages that do not exist yet show a "Soon" tag and cannot be opened. */
export function NavItem(props: NavItemProps) {
  if (props.status === 'soon') {
    return (
      <div aria-disabled="true" className={cx(base, 'cursor-default text-fg-subtle')}>
        <ItemBody {...props} />
      </div>
    );
  }

  return (
    <Link
      href={props.href}
      aria-current={props.active ? 'page' : undefined}
      className={cx(
        base,
        'transition-colors outline-none focus-visible:focus-ring',
        props.active ? 'text-brand' : 'text-fg-muted hover:bg-surface-muted hover:text-fg',
      )}
    >
      <ItemBody {...props} />
    </Link>
  );
}

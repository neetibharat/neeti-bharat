import { IconChevronRight, type Icon } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { cx } from '@/lib/utils/cx';

export type RowTone = 'danger' | 'accent' | 'brand' | 'success' | 'muted';

const TILES: Record<RowTone, string> = {
  danger: 'bg-danger-soft text-danger',
  accent: 'bg-accent-soft text-accent',
  brand: 'bg-brand-soft text-brand',
  success: 'bg-success-soft text-success',
  muted: 'bg-surface-muted text-fg-muted',
};

export interface IconLinkRowProps {
  href: string;
  icon: Icon;
  tone: RowTone;
  title: string;
  subtitle: string;
  /** Something to show before the arrow, such as a due date. */
  trailing?: ReactNode;
  /** Called when the row is opened, for example to note that it was seen. */
  onOpen?: () => void;
}

/** A list item that opens something: a coloured icon, a title with a line under it, and an arrow. */
export function IconLinkRow({
  href,
  icon: RowIcon,
  tone,
  title,
  subtitle,
  trailing,
  onOpen,
}: IconLinkRowProps) {
  return (
    <li>
      <Link
        href={href}
        onClick={onOpen}
        className="group flex items-center gap-3 rounded-control border border-line bg-surface px-3 py-2.5 transition hover:border-line-strong hover:bg-surface-muted/60"
      >
        <span className={cx('grid size-9 shrink-0 place-items-center rounded-lg', TILES[tone])}>
          <RowIcon className="size-4.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-medium text-fg">{title}</span>
          <span className="block truncate text-label text-fg-muted">{subtitle}</span>
        </span>
        {trailing}
        <IconChevronRight className="size-4 shrink-0 text-fg-subtle transition group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}

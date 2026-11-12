'use client';

import {
  Cell as AriaCell,
  Column as AriaColumn,
  Row as AriaRow,
  Table as AriaTable,
  TableBody as AriaTableBody,
  TableHeader as AriaTableHeader,
  type CellProps,
  type ColumnProps,
  type RowProps,
  type TableBodyProps,
  type TableHeaderProps,
  type TableProps,
} from 'react-aria-components';
import { cx } from '@/lib/utils/cx';

/** Compose these like a normal table: Table > TableHeader > TableColumn, then TableBody > TableRow > TableCell. */
export function Table(props: TableProps) {
  return (
    <div className="overflow-x-auto rounded-card border border-line/70 bg-surface shadow-card">
      <AriaTable {...props} className="w-full border-collapse text-left text-body" />
    </div>
  );
}

export function TableHeader<T extends object>(props: TableHeaderProps<T>) {
  return <AriaTableHeader {...props} className="border-b border-line bg-surface-sunken" />;
}

export function TableColumn(props: ColumnProps) {
  return (
    <AriaColumn
      {...props}
      className={cx(
        'px-4 py-2.5 text-caption font-semibold tracking-wide text-fg-muted uppercase outline-none',
        props.className as string | undefined,
      )}
    />
  );
}

export function TableBody<T extends object>(props: TableBodyProps<T>) {
  return <AriaTableBody {...props} />;
}

export function TableRow<T extends object>(props: RowProps<T>) {
  return (
    <AriaRow
      {...props}
      className={cx(
        'border-t border-line outline-none transition-colors data-hovered:bg-surface-muted data-selected:bg-brand-soft data-focus-visible:focus-ring',
        props.className as string | undefined,
      )}
    />
  );
}

export function TableCell(props: CellProps) {
  return (
    <AriaCell
      {...props}
      className={cx('px-4 py-3 text-fg outline-none', props.className as string | undefined)}
    />
  );
}

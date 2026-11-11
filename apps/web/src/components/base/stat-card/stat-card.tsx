import type { ReactNode } from 'react';
import { Card } from '@/components/base/card/card';
import { DeltaChip, type DeltaChipProps } from '@/components/base/delta-chip/delta-chip';

export interface StatCardProps {
  label: string;
  /** The figure, already formatted. */
  value: string;
  delta?: DeltaChipProps;
  /** A menu or other control for the card, top right. */
  actions?: ReactNode;
  /** Anything below the figure, such as a breakdown or a note. */
  children?: ReactNode;
  className?: string;
}

/** A card with one large figure: what it measures, the number, and how it changed. */
export function StatCard({ label, value, delta, actions, children, className }: StatCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-subtitle font-medium text-fg">{label}</h2>
        {actions}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <p className="text-stat font-medium tracking-tight text-fg tabular-nums">{value}</p>
        {delta && <DeltaChip {...delta} />}
      </div>
      {children && <div className="mt-6 border-t border-line pt-5">{children}</div>}
    </Card>
  );
}

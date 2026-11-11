import { IconArrowDownRight, IconArrowUpRight } from '@tabler/icons-react';
import { cx } from '@/lib/utils/cx';

export interface DeltaChipProps {
  /** The change, already formatted, for example "+15%" or "4 hours". */
  value: string;
  direction: 'up' | 'down';
  /** Whether that direction is good news. A drop in failures is `down` and good. */
  isGood?: boolean;
  className?: string;
}

/** A small lifted chip showing how a figure changed. Colour says good or bad, the arrow says which way. */
export function DeltaChip({
  value,
  direction,
  isGood = direction === 'up',
  className,
}: DeltaChipProps) {
  const DeltaIcon = direction === 'up' ? IconArrowUpRight : IconArrowDownRight;
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-label font-semibold shadow-soft',
        isGood ? 'text-success' : 'text-danger',
        className,
      )}
    >
      <DeltaIcon className="size-4" stroke={2} />
      {value}
    </span>
  );
}

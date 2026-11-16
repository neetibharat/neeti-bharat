import { Card } from '@/components/base/card/card';
import { cx } from '@/lib/utils/cx';

type Tone = 'danger' | 'accent' | 'brand' | 'neutral';

const TONES: Record<Tone, string> = {
  danger: 'text-danger',
  accent: 'text-accent',
  brand: 'text-brand',
  neutral: 'text-fg',
};

export interface StatTileProps {
  label: string;
  value: string | number;
  /** A line under the figure. */
  note?: string;
  /** The colour of the figure when it is above zero. A zero is always quiet. */
  tone?: Tone;
}

/** A small card with one figure: what it counts, the number, and an optional note. */
export function StatTile({ label, value, note, tone = 'neutral' }: StatTileProps) {
  const quiet = Number(value) === 0 && typeof value === 'number';

  return (
    <Card>
      <p className="text-label font-medium text-fg-muted">{label}</p>
      <p
        className={cx(
          'mt-2 text-stat font-medium tracking-tight tabular-nums',
          quiet ? 'text-fg-subtle' : TONES[tone],
        )}
      >
        {value}
      </p>
      {note && <p className="mt-1 text-caption text-fg-subtle">{note}</p>}
    </Card>
  );
}

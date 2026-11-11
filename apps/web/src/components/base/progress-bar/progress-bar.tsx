'use client';

import { Label, ProgressBar as AriaProgressBar } from 'react-aria-components';
import { cx } from '@/lib/utils/cx';

type Tone = 'success' | 'brand' | 'accent' | 'danger';

export interface ProgressBarProps {
  /** Always the bar's accessible name. It is also shown above the bar when there is a `valueText`. */
  label: string;
  /** 0 to 100. */
  value: number;
  /** A figure for the right of the label, for example "12 of 47". It puts the label and figure on a line above the bar. */
  valueText?: string;
  /** Shows the percentage beside the bar, for table rows. */
  showPercent?: boolean;
  tone?: Tone;
  className?: string;
}

const fills: Record<Tone, string> = {
  success: 'bg-success',
  brand: 'bg-brand',
  accent: 'bg-accent',
  danger: 'bg-danger',
};

/** A solid bar. Add a `valueText` for a line above it, or `showPercent` for the percentage beside it. */
export function ProgressBar(props: ProgressBarProps) {
  const { label, value, valueText, showPercent, tone = 'brand', className } = props;

  return (
    <AriaProgressBar
      aria-label={valueText ? undefined : label}
      value={value}
      valueLabel={valueText}
      className={cx('flex gap-2', showPercent ? 'items-center gap-3' : 'flex-col', className)}
    >
      {({ percentage }) => (
        <>
          {valueText && (
            <div className="flex items-baseline justify-between gap-3">
              <Label className="text-body text-fg-muted">{label}</Label>
              <span className="text-body font-medium text-fg tabular-nums">{valueText}</span>
            </div>
          )}
          <Track percentage={percentage ?? 0} tone={tone} grow={showPercent} />
          {showPercent && (
            <span className="w-10 text-right text-caption font-medium text-fg-muted tabular-nums">
              {value}%
            </span>
          )}
        </>
      )}
    </AriaProgressBar>
  );
}

function Track(props: { percentage: number; tone: Tone; grow?: boolean }) {
  return (
    <div
      className={cx(
        'h-2.5 overflow-hidden rounded-full bg-surface-muted',
        props.grow && 'min-w-20 flex-1',
      )}
    >
      <div
        className={cx(
          'h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none',
          fills[props.tone],
        )}
        style={{ width: `${props.percentage}%` }}
      />
    </div>
  );
}

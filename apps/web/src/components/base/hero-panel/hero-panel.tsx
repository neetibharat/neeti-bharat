import type { ReactNode } from 'react';
import { Gauge } from '@/components/base/gauge/gauge';
import { cx } from '@/lib/utils/cx';

export interface HeroPanelProps {
  /** A small tag at the top. */
  tag: string;
  /** 0 to 100. */
  percent: number;
  /** What the gauge says, in words, for screen readers. */
  gaugeLabel: string;
  title: string;
  text: string;
  /** The facts under the gauge: a `HeroFacts`. */
  children?: ReactNode;
}

/** The highlighted card of a page: a big gauge, a sentence about it, and a row of facts, on the brand gradient. */
export function HeroPanel({ tag, percent, gaugeLabel, title, text, children }: HeroPanelProps) {
  return (
    <section className="flex flex-col gap-6 rounded-card bg-linear-to-br from-brand-panel-from to-brand-panel-to p-6 text-on-brand shadow-card">
      <span className="w-fit rounded-full bg-on-brand-soft px-3 py-1 text-label font-medium">
        {tag}
      </span>
      <div className="flex items-center gap-6">
        <div role="img" aria-label={gaugeLabel} className="relative size-36 shrink-0">
          <Gauge percent={percent} />
          <p className="absolute inset-0 grid place-content-center text-stat font-medium tracking-tight tabular-nums">
            {percent}%
          </p>
        </div>
        <div className="min-w-0">
          <h2 className="text-subtitle font-semibold">{title}</h2>
          <p className="mt-1 text-body text-on-brand-muted">{text}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

/** Three facts side by side under the gauge. */
export function HeroFacts({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-3 divide-x divide-on-brand-soft rounded-control bg-on-brand-faint">
      {children}
    </dl>
  );
}

export interface HeroFactProps {
  label: string;
  value: string;
  /** Warms the figure to say it needs attention. */
  isAlert?: boolean;
  /** A small dot before the label, as a background class. */
  dot?: string;
}

export function HeroFact({ label, value, isAlert, dot }: HeroFactProps) {
  return (
    <div className="px-4 py-3">
      <dt className="flex items-center gap-2 text-caption text-on-brand-muted">
        {dot && <span aria-hidden className={cx('size-2 rounded-full', dot)} />}
        {label}
      </dt>
      <dd
        className={cx(
          'mt-0.5 text-title font-semibold tabular-nums',
          isAlert && 'text-on-brand-warm',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

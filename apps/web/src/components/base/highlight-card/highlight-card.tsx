import type { ReactNode } from 'react';
import { cx } from '@/lib/utils/cx';

export interface HighlightCardProps {
  /** A small tag at the top, for example "Insight". */
  tag?: string;
  /** The large figure. */
  figure: string;
  title: string;
  children?: ReactNode;
  className?: string;
}

/** The one highlighted card on a page: a big figure and a plain sentence about it, on a white card. */
export function HighlightCard({ tag, figure, title, children, className }: HighlightCardProps) {
  return (
    <section
      className={cx(
        'flex flex-col justify-between gap-8 rounded-card border border-line/70 bg-surface p-6 text-fg shadow-card',
        className,
      )}
    >
      {tag && (
        <span className="w-fit rounded-full bg-brand-soft px-3 py-1 text-label font-medium text-brand">
          {tag}
        </span>
      )}
      <div>
        <p className="text-stat font-medium tracking-tight text-brand tabular-nums">{figure}</p>
        <h2 className="mt-3 text-subtitle font-semibold">{title}</h2>
        {children && <div className="mt-2 text-body text-fg-muted">{children}</div>}
      </div>
    </section>
  );
}

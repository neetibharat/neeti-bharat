import type { ReactNode } from 'react';
import { cx } from '@/lib/utils/cx';

export interface GradientCardProps {
  /** A small tag at the top, for example "Insight". */
  tag?: string;
  /** The large figure. */
  figure: string;
  title: string;
  children?: ReactNode;
  className?: string;
}

/** The one highlighted card on a page: a big figure and a plain sentence about it, on a gradient. */
export function GradientCard({ tag, figure, title, children, className }: GradientCardProps) {
  return (
    <section
      className={cx(
        'flex flex-col justify-between gap-8 rounded-card bg-linear-to-br from-hero-from to-hero-to p-6 text-on-brand shadow-card',
        className,
      )}
    >
      {tag && (
        <span className="w-fit rounded-full bg-on-brand-soft px-3 py-1 text-label font-medium">
          {tag}
        </span>
      )}
      <div>
        <p className="text-stat font-medium tracking-tight tabular-nums">{figure}</p>
        <h2 className="mt-3 text-subtitle font-semibold">{title}</h2>
        {children && <div className="mt-2 text-body text-on-brand-muted">{children}</div>}
      </div>
    </section>
  );
}

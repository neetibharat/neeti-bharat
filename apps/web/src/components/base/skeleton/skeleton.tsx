'use client';

import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/base/spinner/spinner';
import { cx } from '@/lib/utils/cx';

/** A grey block with a soft light moving across it while something loads. The light stops for people who ask for less. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        'relative overflow-hidden rounded-control bg-surface-muted',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer motion-reduce:after:animate-none',
        'after:bg-linear-to-r after:from-transparent after:via-surface/70 after:to-transparent',
        className,
      )}
    />
  );
}

/** What a page shows while its data loads: a title, a row of figures and a body, so the layout does not jump. */
export function PageSkeleton() {
  const t = useTranslations('common');

  return (
    <div role="status" aria-busy="true" aria-label={t('loading')} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-card" />
        ))}
      </div>
      <div className="relative">
        <Skeleton className="h-72 rounded-card" />
        <Spinner className="absolute top-1/2 left-1/2 size-8 -translate-1/2 text-fg-subtle" />
      </div>
    </div>
  );
}

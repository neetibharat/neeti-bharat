import { cx } from '@/lib/utils/cx';

/** A grey block that pulses while something loads. Motion stops for people who ask for less. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        'animate-pulse rounded-control bg-surface-muted motion-reduce:animate-none',
        className,
      )}
    />
  );
}

/** What a page shows while its data loads: a title, a row of figures and a body, so the layout does not jump. */
export function PageSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-card" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-card" />
    </div>
  );
}

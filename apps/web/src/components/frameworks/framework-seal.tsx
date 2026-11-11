import { cx } from '@/lib/utils/cx';

/** A small square with a framework's short name, in place of a logo. */
export function FrameworkSeal({
  name,
  muted,
  className,
}: {
  name: string;
  /** For frameworks that are not switched on. */
  muted?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cx(
        'grid h-12 min-w-14 shrink-0 place-items-center rounded-control px-2 text-label font-semibold',
        muted ? 'bg-surface-muted text-fg-subtle' : 'bg-brand text-on-brand',
        className,
      )}
    >
      {name}
    </span>
  );
}

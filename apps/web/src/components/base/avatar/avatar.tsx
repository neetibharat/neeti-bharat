import { cx } from '@/lib/utils/cx';

type Size = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  /** A name or email; the first letter is shown. */
  name: string;
  size?: Size;
  className?: string;
}

const sizes: Record<Size, string> = {
  sm: 'size-6 text-caption',
  md: 'size-8 text-label',
  lg: 'size-10 text-subtitle',
};

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'grid shrink-0 place-items-center rounded-full bg-brand-soft font-semibold text-brand',
        sizes[size],
        className,
      )}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

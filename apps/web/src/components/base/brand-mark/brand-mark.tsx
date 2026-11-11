import { cx } from '@/lib/utils/cx';

type Size = 'sm' | 'md';

export interface BrandMarkProps {
  size?: Size;
  className?: string;
}

const sizes: Record<Size, { tile: string; dot: string }> = {
  sm: { tile: 'size-5.5 rounded-md', dot: 'right-0.75 bottom-0.75 size-1.5' },
  md: { tile: 'size-7 rounded-lg', dot: 'right-1 bottom-1 size-2' },
};

/** The logo mark: a navy tile with a saffron dot. */
export function BrandMark({ size = 'md', className }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cx('relative inline-block bg-brand', sizes[size].tile, className)}
    >
      <span className={cx('absolute rounded-full bg-accent', sizes[size].dot)} />
    </span>
  );
}

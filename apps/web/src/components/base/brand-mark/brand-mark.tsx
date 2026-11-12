import { cx } from '@/lib/utils/cx';

type Size = 'sm' | 'md' | 'lg';
/** `inverse` is for a dark background: a light tile with the saffron dot. */
type Tone = 'brand' | 'inverse';

export interface BrandMarkProps {
  size?: Size;
  tone?: Tone;
  className?: string;
}

const sizes: Record<Size, { tile: string; dot: string }> = {
  sm: { tile: 'size-5.5 rounded-md', dot: 'right-0.75 bottom-0.75 size-1.5' },
  md: { tile: 'size-7 rounded-lg', dot: 'right-1 bottom-1 size-2' },
  lg: { tile: 'size-10 rounded-xl', dot: 'right-1.5 bottom-1.5 size-3' },
};

const tones: Record<Tone, string> = { brand: 'bg-brand', inverse: 'bg-surface' };

/** The logo mark: a navy tile with a saffron dot. */
export function BrandMark({ size = 'md', tone = 'brand', className }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cx('relative inline-block', tones[tone], sizes[size].tile, className)}
    >
      <span className={cx('absolute rounded-full bg-accent', sizes[size].dot)} />
    </span>
  );
}

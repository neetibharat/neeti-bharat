import { cx } from '@/lib/utils/cx';

type Size = 'sm' | 'md' | 'lg';
/** `inverse` is for a dark background: the mark without its tile, which would vanish there. */
type Tone = 'brand' | 'inverse';

export interface BrandMarkProps {
  size?: Size;
  tone?: Tone;
  className?: string;
}

const sizes: Record<Size, string> = { sm: 'size-5.5', md: 'size-7', lg: 'size-10' };

/** The logo mark: an orange N finished by a green stroke with a white point, on a navy tile. */
export function BrandMark({ size = 'md', tone = 'brand', className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cx('inline-block shrink-0', sizes[size], className)}
    >
      {tone === 'brand' && <rect width="32" height="32" rx="8" className="fill-logo-tile" />}
      <path
        d="M10 22.5V10l11.5 12.5"
        fill="none"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-logo-letter"
      />
      <path
        d="M22 22.5v-8"
        strokeWidth="3.4"
        strokeLinecap="round"
        className="stroke-logo-finish"
      />
      <circle cx="22" cy="9.6" r="1.95" className="fill-logo-point" />
    </svg>
  );
}

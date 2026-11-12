import { cx } from '@/lib/utils/cx';

export interface SpinnerProps {
  /** Size and colour come from the classes: the arms use the text colour. Default is 1rem. */
  className?: string;
}

const ARMS = 6;
// Each arm fades a little more than the one in front of it, which leaves a trail behind the lead arm as it turns.
const TRAIL = [1, 0.78, 0.58, 0.4, 0.26, 0.15];

/**
 * A six-armed asterisk that turns, for something that is loading. The arms are short and do not meet, with a trail
 * behind the leading one. Decorative: put the words on whatever holds it.
 */
export function Spinner({ className }: SpinnerProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className={cx('size-4 shrink-0 animate-spinner motion-reduce:animate-none', className)}
    >
      {TRAIL.map((opacity, index) => (
        <line
          key={index}
          x1="12"
          y1="2.75"
          x2="12"
          y2="8"
          opacity={opacity}
          transform={`rotate(${-(360 / ARMS) * index} 12 12)`}
        />
      ))}
    </svg>
  );
}

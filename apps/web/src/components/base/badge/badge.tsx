import type { ReactNode } from 'react';
import { cx } from '@/lib/utils/cx';

type Color = 'gray' | 'brand' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  color?: Color;
  children: ReactNode;
  className?: string;
}

const colors: Record<Color, string> = {
  gray: 'bg-surface-muted text-fg-muted',
  brand: 'bg-brand-soft text-brand',
  success: 'bg-success-soft text-success',
  warning: 'bg-accent-soft text-accent',
  danger: 'bg-danger-soft text-danger',
};

export function Badge({ color = 'gray', children, className }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-semibold whitespace-nowrap',
        colors[color],
        className,
      )}
    >
      {children}
    </span>
  );
}

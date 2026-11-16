import type { ReactNode } from 'react';
import { cx } from '@/lib/utils/cx';

type Variant = 'default' | 'dashed';
type Padding = 'none' | 'sm' | 'md';

export interface CardProps {
  title?: string;
  description?: string;
  /** Buttons for the card, top right, level with its title. */
  actions?: ReactNode;
  children?: ReactNode;
  /** `dashed` is an outline with no fill, for a place where something is yet to be added. */
  variant?: Variant;
  /** `none` is for content that brings its own spacing, such as a table or a row of figures. */
  padding?: Padding;
  /** The landmark: `aside` for a side panel. */
  as?: 'section' | 'aside';
  className?: string;
}

const variants: Record<Variant, string> = {
  default: 'border border-line/70 bg-surface shadow-card',
  dashed: 'border border-dashed border-line-strong',
};

const paddings: Record<Padding, string> = {
  none: '',
  sm: 'p-5',
  md: 'p-6',
};

export function Card(props: CardProps) {
  const { children, className, as: Tag = 'section', variant = 'default', padding = 'md' } = props;

  return (
    <Tag className={cx('rounded-card', variants[variant], paddings[padding], className)}>
      <CardHeader {...props} />
      {children}
    </Tag>
  );
}

function CardHeader({ title, description, actions }: CardProps) {
  if (!title && !description && !actions) return null;

  return (
    <header className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        {title && <h2 className="text-subtitle font-semibold text-fg">{title}</h2>}
        {description && <p className="mt-0.5 text-label text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

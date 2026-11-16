import type { ReactNode } from 'react';
import { cx } from '@/lib/utils/cx';

export interface SettingCardProps {
  title: string;
  description?: string;
  /** The field or control being set. */
  children: ReactNode;
  /** Small print on the left of the footer, such as a limit or a format. */
  hint?: string;
  /** Usually a Save button, on the right of the footer. */
  action?: ReactNode;
  className?: string;
}

/** One setting on its own card: what it is, the field, and a footer with a hint and the action. */
export function SettingCard({
  title,
  description,
  children,
  hint,
  action,
  className,
}: SettingCardProps) {
  return (
    <section className={cx('rounded-card border border-line/70 bg-surface shadow-card', className)}>
      <div className="p-6">
        <h2 className="text-subtitle font-semibold text-fg">{title}</h2>
        {description && <p className="mt-0.5 text-body text-fg-muted">{description}</p>}
        <div className="mt-4 max-w-md">{children}</div>
      </div>
      {(hint || action) && (
        <footer className="flex min-h-14 items-center justify-between gap-4 rounded-b-card border-t border-line bg-surface-muted/60 px-6 py-3">
          <p className="text-label text-fg-subtle">{hint}</p>
          {action}
        </footer>
      )}
    </section>
  );
}

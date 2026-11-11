import type { Icon } from '@tabler/icons-react';
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon: Icon;
  title: string;
  description?: string;
  /** A button or link that fixes the emptiness. */
  action?: ReactNode;
}

export function EmptyState({ icon: StateIcon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-brand-soft text-brand">
        <StateIcon className="size-6" />
      </span>
      <div>
        <p className="text-subtitle font-semibold text-fg">{title}</p>
        {description && <p className="mt-1 max-w-sm text-body text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

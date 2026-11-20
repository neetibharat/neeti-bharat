import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** Buttons or links shown on the right. */
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="text-hero font-medium tracking-tight text-fg">{title}</h1>
        {description && <p className="mt-1 text-body text-fg-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

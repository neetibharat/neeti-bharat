'use client';

import { IconCircleCheckFilled } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Badge } from '@/components/base/badge/badge';
import { TAGS_SHOWN, type CatalogProvider } from '@/lib/connection-providers';
import { cx } from '@/lib/utils/cx';

function ProviderTags({ provider }: { provider: CatalogProvider }) {
  const t = useTranslations('connections.catalog');
  const shown = provider.tags.slice(0, TAGS_SHOWN);
  const more = provider.tags.length - shown.length;

  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={t('checks')}>
      {shown.map((tag) => (
        <li key={tag}>
          <Badge>{t(`tags.${tag}`)}</Badge>
        </li>
      ))}
      {more > 0 && (
        <li>
          <Badge>{t('more', { count: more })}</Badge>
        </li>
      )}
    </ul>
  );
}

export interface ProviderCardProps {
  provider: CatalogProvider;
  /** How many connections of this kind there are. A card with at least one shows as connected. */
  connected: number;
  /** The button, or whatever stands in for it. */
  action: ReactNode;
}

/** One system on the catalog: what it is, what is checked, and how to connect it. */
export function ProviderCard({ provider, connected, action }: ProviderCardProps) {
  const t = useTranslations('connections.catalog');
  const text = t as unknown as (key: string, values?: Record<string, number>) => string;
  const { icon: ProviderIcon, id, available } = provider;

  return (
    <section
      className={cx(
        'flex flex-col gap-4 rounded-card border bg-surface p-6 shadow-card',
        connected > 0 ? 'border-success/40' : 'border-line/70',
      )}
    >
      <header className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-control border border-line bg-surface text-fg">
          <ProviderIcon className="size-6" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-subtitle font-semibold text-fg">
            {text(`providers.${id}.name`)}
            {connected > 0 && (
              <IconCircleCheckFilled
                className="size-4 text-success"
                aria-label={t('connected', { count: connected })}
              />
            )}
          </h3>
          <p className="text-label text-fg-muted">{text(`providers.${id}.category`)}</p>
        </div>
      </header>
      <p className="text-body text-fg-muted">{text(`providers.${id}.about`)}</p>
      <ProviderTags provider={provider} />
      <footer className="mt-auto border-t border-line pt-4">
        {available ? action : <p className="text-center text-label text-fg-subtle">{t('soon')}</p>}
      </footer>
    </section>
  );
}

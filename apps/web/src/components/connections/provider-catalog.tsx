'use client';

import { IconPlus } from '@tabler/icons-react';
import type { ConnectionSummary } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { CATALOG } from '@/lib/connection-providers';
import { AddConnectionForm } from './add-connection-form';
import { ProviderCard } from './provider-card';

/** The way in for an admin: opens the form for the system. Others are told who can set it up. */
function SetUp({
  connected,
  enabled,
  isAdmin,
}: {
  connected: number;
  enabled: boolean;
  isAdmin: boolean;
}) {
  const t = useTranslations('connections');
  if (!isAdmin)
    return <p className="text-center text-label text-fg-subtle">{t('catalog.adminOnly')}</p>;

  return (
    <Modal
      trigger={
        <Button className="w-full" iconLeading={IconPlus} isDisabled={!enabled}>
          {t(connected > 0 ? 'catalog.addAnother' : 'catalog.setUp')}
        </Button>
      }
      title={t('form.title')}
      description={t('form.description')}
      size="lg"
    >
      {(close) => <AddConnectionForm onDone={close} />}
    </Modal>
  );
}

export interface ProviderCatalogProps {
  connections: ConnectionSummary[];
  /** False until the install can keep credentials: the way in is then shown but switched off. */
  enabled: boolean;
  isAdmin: boolean;
}

/** The systems that can be connected, as cards. One that is already connected shows it, and can be added again. */
export function ProviderCatalog({ connections, enabled, isAdmin }: ProviderCatalogProps) {
  const t = useTranslations('connections.catalog');

  return (
    <section className="flex flex-col gap-4" aria-labelledby="catalog-title">
      <div>
        <h2 id="catalog-title" className="text-title font-semibold text-fg">
          {t('title')}
        </h2>
        <p className="mt-0.5 text-body text-fg-muted">{t('description')}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CATALOG.map((provider) => {
          const connected = connections.filter((c) => c.provider === provider.id).length;
          return (
            <ProviderCard
              key={provider.id}
              provider={provider}
              connected={connected}
              action={<SetUp connected={connected} enabled={enabled} isAdmin={isAdmin} />}
            />
          );
        })}
      </div>
    </section>
  );
}

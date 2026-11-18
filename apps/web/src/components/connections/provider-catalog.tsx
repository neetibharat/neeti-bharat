'use client';

import { IconPlus } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { CATALOG, type CatalogProviderId } from '@/lib/connection-providers';
import { AddConnectionForm } from './add-connection-form';
import { AddGithubForm } from './add-github-form';
import { ProviderCard } from './provider-card';

/** The way in for an admin: opens the form for the system. Others are told who can set it up. */
function SetUp({
  provider,
  connected,
  enabled,
  isAdmin,
}: {
  provider: CatalogProviderId;
  connected: number;
  enabled: boolean;
  isAdmin: boolean;
}) {
  const t = useTranslations('connections');
  // The setup guide has long steps, so the dialog is wider while it is open.
  const [guideOpen, setGuideOpen] = useState(false);
  if (!isAdmin)
    return <p className="text-center text-label text-fg-subtle">{t('catalog.adminOnly')}</p>;

  return (
    <Modal
      trigger={
        <Button className="w-full" iconLeading={IconPlus} isDisabled={!enabled}>
          {t(connected > 0 ? 'catalog.addAnother' : 'catalog.setUp')}
        </Button>
      }
      title={t(provider === 'github' ? 'githubForm.title' : 'form.title')}
      description={t(provider === 'github' ? 'githubForm.description' : 'form.description')}
      size={guideOpen ? 'xl' : 'lg'}
    >
      {(close) =>
        provider === 'github' ? (
          <AddGithubForm onDone={close} guideOpen={guideOpen} onGuideChange={setGuideOpen} />
        ) : (
          <AddConnectionForm onDone={close} guideOpen={guideOpen} onGuideChange={setGuideOpen} />
        )
      }
    </Modal>
  );
}

export interface ProviderCatalogProps {
  /** How many connections there are of each kind, across every page. */
  connected: Partial<Record<string, number>>;
  /** False until the install can keep credentials: the way in is then shown but switched off. */
  enabled: boolean;
  isAdmin: boolean;
}

/** The systems that can be connected, as cards. One that is already connected shows it, and can be added again. */
export function ProviderCatalog({ connected: counts, enabled, isAdmin }: ProviderCatalogProps) {
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
          const connected = counts[provider.id] ?? 0;
          return (
            <ProviderCard
              key={provider.id}
              provider={provider}
              connected={connected}
              action={
                <SetUp
                  provider={provider.id}
                  connected={connected}
                  enabled={enabled}
                  isAdmin={isAdmin}
                />
              }
            />
          );
        })}
      </div>
    </section>
  );
}

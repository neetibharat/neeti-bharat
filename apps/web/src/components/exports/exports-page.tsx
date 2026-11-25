'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/base/card/card';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Tabs } from '@/components/base/tabs/tabs';
import { DownloadButton } from './download-button';
import { EvidencePacks } from './evidence-packs';
import { ExportLists } from './export-lists';

/** What an auditor asks for: everything in one zip, one rule's evidence in a zip, or one list at a time as a spreadsheet. */
export function ExportsPage() {
  const t = useTranslations('exports');

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <div className="flex flex-col gap-6">
        <Card
          title={t('pack.title')}
          description={t('pack.description')}
          actions={
            <DownloadButton
              path="/exports/audit-pack"
              fallbackName="audit-pack.zip"
              label={t('pack.download')}
            />
          }
        />
        <Tabs
          defaultSelectedKey="evidence"
          tabs={[
            { id: 'evidence', label: t('tabs.evidence'), content: <EvidencePacks /> },
            { id: 'lists', label: t('tabs.lists'), content: <ExportLists /> },
          ]}
        />
      </div>
    </>
  );
}

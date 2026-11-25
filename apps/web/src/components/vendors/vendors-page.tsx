'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/base/page-header/page-header';
import { useCan } from '@/components/providers/user-provider';
import { AddVendorButton } from './add-vendor-button';
import { VendorDirectory } from './vendor-directory';

/** The companies that handle the company's personal data: what they do, what they are given, and whether it is all in order. */
export function VendorsPage() {
  const t = useTranslations('vendors');
  const { canEdit } = useCan();

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={canEdit ? <AddVendorButton /> : undefined}
      />
      <VendorDirectory />
    </>
  );
}

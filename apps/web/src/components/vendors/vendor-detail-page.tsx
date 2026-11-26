'use client';

import type { VendorResponse } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Badge } from '@/components/base/badge/badge';
import { Breadcrumb } from '@/components/base/breadcrumb/breadcrumb';
import { Loading } from '@/components/base/loading/loading';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Tabs } from '@/components/base/tabs/tabs';
import { useCan } from '@/components/providers/user-provider';
import { useGetVendorQuery } from '@/lib/api/vendors-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { ArchiveVendorButton } from './archive-vendor-button';
import { VendorActivityCard } from './vendor-activity';
import { VendorRiskTab, VendorTreatmentTab } from './vendor-risk';
import { DataCard, DetailsCard, ReviewCard } from './vendor-sections';

/** One vendor on its own page: what needs doing, then its details, data, agreement and review, each changed on its own. */
export function VendorDetailPage({ vendorId }: { vendorId: string }) {
  const t = useTranslations('vendors');
  const errorMessage = useErrorMessage();
  const { data, error } = useGetVendorQuery(vendorId);

  if (error) {
    return (
      <>
        <Breadcrumb crumbs={[{ label: t('title'), href: '/vendors' }]} />
        <Alert tone="error">{errorMessage(error)}</Alert>
      </>
    );
  }
  if (!data) return <Loading />;
  return <Body vendor={data} />;
}

function Body({ vendor }: { vendor: VendorResponse }) {
  const t = useTranslations('vendors');
  const { canEdit } = useCan();
  const tabs = useVendorTabs(vendor);

  return (
    <>
      <Breadcrumb crumbs={[{ label: t('title'), href: '/vendors' }, { label: vendor.name }]} />
      <PageHeader
        title={vendor.name}
        description={vendor.service}
        actions={canEdit ? <ArchiveVendorButton vendor={vendor} labelled /> : undefined}
      />
      <div className="-mt-3 mb-5">
        <Notes vendor={vendor} />
      </div>
      <Tabs tabs={tabs} />
    </>
  );
}

/** The vendor split into what it is, how risky it is, and what has been done to it. */
function useVendorTabs(vendor: VendorResponse) {
  const t = useTranslations('vendors.page');
  return [
    {
      id: 'overview',
      label: t('overview'),
      content: (
        <div className="grid gap-4 lg:grid-cols-2">
          <DetailsCard vendor={vendor} />
          <DataCard vendor={vendor} />
          <ReviewCard vendor={vendor} />
        </div>
      ),
    },
    { id: 'risk', label: t('risk'), content: <VendorRiskTab vendor={vendor} /> },
    { id: 'treatment', label: t('treatment'), content: <VendorTreatmentTab vendor={vendor} /> },
    { id: 'history', label: t('history'), content: <VendorActivityCard vendorId={vendor.id} /> },
  ];
}

/** A quiet line under the title: that the vendor is archived, or what is still missing, as small badges. */
function Notes({ vendor }: { vendor: VendorResponse }) {
  const t = useTranslations('vendors');
  if (vendor.archivedAt) return <p className="text-label text-fg-muted">{t('archivedNote')}</p>;
  if (vendor.attention.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1.5">
      {vendor.attention.map((reason) => (
        <li key={reason}>
          <Badge color="warning">{t(`attention.${reason}`)}</Badge>
        </li>
      ))}
    </ul>
  );
}

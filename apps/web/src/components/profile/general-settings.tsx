'use client';

import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { PageHeader } from '@/components/base/page-header/page-header';
import { PageSkeleton } from '@/components/base/skeleton/skeleton';
import { CloseOrganizationCard } from '@/components/organizations/close-organization-card';
import { useGetProfileQuery } from '@/lib/api/profile-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { IdentityCard } from './identity-card';

/** The organisation's identity, in one card, and the way to close it, set apart below. */
export function GeneralSettings() {
  const t = useTranslations('profile');
  const errorMessage = useErrorMessage();
  const { data, error } = useGetProfileQuery();

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <PageSkeleton />;

  const name = data.entries.find((entry) => entry.key === 'companyName');
  const website = data.entries.find((entry) => entry.key === 'website');

  return (
    <>
      <PageHeader title={t('general.title')} description={t('general.description')} />
      <div className="flex max-w-4xl flex-col gap-8">
        {name && <IdentityCard name={name} website={website} />}
        <CloseOrganizationCard />
      </div>
    </>
  );
}

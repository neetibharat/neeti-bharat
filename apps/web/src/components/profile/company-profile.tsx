'use client';

import { IconSearch } from '@tabler/icons-react';
import { PROFILE_GROUPS } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Badge } from '@/components/base/badge/badge';
import { Card } from '@/components/base/card/card';
import { EmptyState } from '@/components/base/empty-state/empty-state';
import { Input } from '@/components/base/input/input';
import { PageSkeleton } from '@/components/base/skeleton/skeleton';
import { PageHeader } from '@/components/base/page-header/page-header';
import { useGetProfileQuery } from '@/lib/api/profile-api';
import { matchesSearch } from '@/lib/filters';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { AddEntryButton } from './add-entry-button';
import { ProfileTable } from './profile-table';
import { useEntryText } from './use-entry-text';

/** The company's name and website live on the General page. Everything else is listed here. */
const GROUPS = [...PROFILE_GROUPS.filter((group) => group !== 'general'), 'custom' as const];

export function CompanyProfile() {
  const t = useTranslations('profile');
  const errorMessage = useErrorMessage();
  const text = useEntryText();
  const [search, setSearch] = useState('');
  const { data, error } = useGetProfileQuery();

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <PageSkeleton />;

  const entries = data.entries.filter((entry) => entry.group !== 'general');
  const shown = entries.filter((entry) => matchesSearch([text.label(entry), entry.value], search));
  const missing = entries.filter((entry) => !entry.isCustom && entry.value === '').length;

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} actions={<AddEntryButton />} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Input
          aria-label={t('searchPlaceholder')}
          placeholder={t('searchPlaceholder')}
          iconLeading={IconSearch}
          value={search}
          onChange={setSearch}
          className="w-full sm:w-80"
        />
        <Badge color={missing ? 'warning' : 'success'}>
          {missing ? t('unanswered', { count: missing }) : t('allAnswered')}
        </Badge>
      </div>
      {shown.length ? (
        <ProfileTable entries={shown} groups={GROUPS} />
      ) : (
        <Card>
          <EmptyState icon={IconSearch} title={t('noResults')} />
        </Card>
      )}
    </>
  );
}

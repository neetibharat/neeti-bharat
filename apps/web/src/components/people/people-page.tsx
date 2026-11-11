'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/base/page-header/page-header';
import { AccessLevelsCard } from './access-levels-card';
import { AddPersonButton } from './add-person-button';
import { PeopleDirectory } from './people-directory';
import { RoleHoldersCard } from './role-holders-card';

export function PeoplePage() {
  const t = useTranslations('people');

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} actions={<AddPersonButton />} />
      <div className="flex flex-col gap-5">
        <PeopleDirectory />
        <RoleHoldersCard />
        <AccessLevelsCard />
      </div>
    </>
  );
}

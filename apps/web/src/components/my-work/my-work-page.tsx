'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useCan } from '@/components/providers/user-provider';
import { Alert } from '@/components/base/alert/alert';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Select } from '@/components/base/select/select';
import { useGetMyWorkQuery } from '@/lib/api/my-work-api';
import { useGetPersonOptionsQuery } from '@/lib/api/people-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { MyWorkCard } from './my-work-card';
import { MyWorkSummary } from './my-work-summary';

const ME = 'me';

/** Whose work to show. Admins can pick anyone; everyone else sees their own. */
function PersonPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const t = useTranslations('pages.myWork');
  const { data } = useGetPersonOptionsQuery();
  const options = [
    { id: ME, label: t('mine') },
    ...(data?.people ?? []).map((person) => ({ id: person.id, label: person.name })),
  ];

  return (
    <Select
      aria-label={t('viewing')}
      className="w-60"
      options={options}
      selectedKey={value}
      onSelectionChange={onChange}
    />
  );
}

export interface MyWorkPageProps {
  /** A person to start on, from `?person=`. */
  initialPerson?: string;
}

/** Everything waiting on one person, on a page of its own. */
export function MyWorkPage({ initialPerson }: MyWorkPageProps) {
  const { isAdmin } = useCan();
  const t = useTranslations('pages.myWork');
  const errorMessage = useErrorMessage();
  // Fixed when the page opens, so the sections do not shift between renders.
  const [now] = useState(() => new Date());
  const [person, setPerson] = useState(isAdmin && initialPerson ? initialPerson : ME);
  const { data, error } = useGetMyWorkQuery(person === ME ? undefined : person);

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={isAdmin ? <PersonPicker value={person} onChange={setPerson} /> : undefined}
      />
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      {data ? (
        <div className="flex flex-col gap-5">
          <MyWorkSummary items={data.items} />
          <MyWorkCard items={data.items} isOther={person !== ME} now={now} />
        </div>
      ) : null}
    </>
  );
}

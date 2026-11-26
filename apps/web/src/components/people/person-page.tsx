'use client';

import { IconFileCheck, IconSchool } from '@tabler/icons-react';
import type { PersonResponse } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { EmptyState } from '@/components/base/empty-state/empty-state';
import { Badge } from '@/components/base/badge/badge';
import { Breadcrumb } from '@/components/base/breadcrumb/breadcrumb';
import { Card } from '@/components/base/card/card';
import { Loading } from '@/components/base/loading/loading';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Tabs } from '@/components/base/tabs/tabs';
import { PolicyList } from '@/components/training/policy-list';
import { TrainingList } from '@/components/training/training-list';
import { Link } from '@/i18n/navigation';
import { useGetPersonPoliciesQuery } from '@/lib/api/policy-acceptance-api';
import { useGetPersonQuery } from '@/lib/api/people-api';
import { useGetPersonTrainingQuery } from '@/lib/api/training-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/** The facts about a person, one to a line. */
function Details({ person }: { person: PersonResponse }) {
  const t = useTranslations('people.person');
  const tRoles = useTranslations('jobRoles');
  const none = t('none');
  const rows: [string, string][] = [
    [t('email'), person.email],
    [t('jobTitle'), person.jobTitle ?? none],
    [t('department'), person.department ?? none],
    [t('roles'), person.roles.map((role) => tRoles(role)).join(', ') || none],
  ];

  return (
    <Card>
      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-label text-fg-muted">{label}</dt>
            <dd className="text-body font-medium text-fg">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

/** What this person has taken. An admin can record or take back a completion for them. */
function PersonTraining({ person }: { person: PersonResponse }) {
  const t = useTranslations('training.mine');
  const errorMessage = useErrorMessage();
  const { data, error } = useGetPersonTrainingQuery(person.id);

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading />;
  if (data.items.length === 0) {
    return <EmptyState icon={IconSchool} title={t('none.title')} description={t('none.body')} />;
  }
  return (
    <TrainingList items={data.items} canAct={person.status === 'active'} personId={person.id} />
  );
}

/** Which approved policies this person has accepted. Only they can accept, so this is to read. */
function PersonPolicies({ person }: { person: PersonResponse }) {
  const t = useTranslations('training.policies');
  const errorMessage = useErrorMessage();
  const { data, error } = useGetPersonPoliciesQuery(person.id);

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading />;
  if (data.items.length === 0) {
    return <EmptyState icon={IconFileCheck} title={t('none.title')} description={t('none.body')} />;
  }
  return <PolicyList items={data.items} canAct={false} />;
}

function Body({ person }: { person: PersonResponse }) {
  const t = useTranslations('people');
  const tabs = [
    { id: 'details', label: t('person.details'), content: <Details person={person} /> },
    { id: 'training', label: t('person.training'), content: <PersonTraining person={person} /> },
    { id: 'policies', label: t('person.policies'), content: <PersonPolicies person={person} /> },
  ];

  return (
    <>
      <Breadcrumb
        crumbs={[{ label: t('title'), href: '/settings/people' }, { label: person.name }]}
      />
      <PageHeader
        title={person.name}
        description={person.email}
        actions={
          <Link
            href={`/my-work?person=${encodeURIComponent(person.id)}`}
            className="rounded-control px-3 py-1.5 text-label font-semibold text-brand hover:bg-brand-soft"
          >
            {t('person.work')}
          </Link>
        }
      />
      {person.status === 'left' && (
        <div className="-mt-3 mb-5">
          <Badge>{t('status.left')}</Badge>
        </div>
      )}
      <Tabs tabs={tabs} />
    </>
  );
}

/** One person on their own page: their details, the trainings they have taken and the policies they have accepted. Admins only. */
export function PersonPage({ personId }: { personId: string }) {
  const t = useTranslations('people');
  const errorMessage = useErrorMessage();
  const { data, error } = useGetPersonQuery(personId);

  if (error) {
    return (
      <>
        <Breadcrumb crumbs={[{ label: t('title'), href: '/settings/people' }]} />
        <Alert tone="error">{errorMessage(error)}</Alert>
      </>
    );
  }
  if (!data) return <Loading />;
  return <Body person={data} />;
}

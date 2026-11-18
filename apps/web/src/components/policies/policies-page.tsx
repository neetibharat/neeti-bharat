'use client';

import { POLICY_STATUSES, policyLabel, type PolicyResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Loading } from '@/components/base/loading/loading';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Tabs, type TabItem } from '@/components/base/tabs/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/base/table/table';
import { Link } from '@/i18n/navigation';
import { useGetPoliciesQuery } from '@/lib/api/frameworks-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { useReviewCadence } from '@/lib/hooks/use-review-cadence';
import { approverOf, filterPolicies, NO_POLICY_FILTERS } from '@/lib/policy-filter';
import { statusCounts } from '@/lib/policy-stats';
import { PoliciesOverview } from './policies-overview';
import { AddPolicyButton } from './add-policy-button';
import { ArchivedPolicies } from './archived-policies';
import { PolicyFilterBar } from './policy-filter-bar';
import { WhereFromButton } from './where-from-button';
import { PolicyStatusBadge } from './policy-status-badge';

/** The policies a company needs. Pick one to see what it covers and what proof to keep. */
export function PoliciesPage() {
  const errorMessage = useErrorMessage();
  const { data, error } = useGetPoliciesQuery();

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading />;

  return (
    <>
      <PoliciesHeader policies={data.policies} />
      <div className="flex flex-col gap-4">
        <PoliciesOverview policies={data.policies} />
        <PolicyList policies={data.policies} />
        <ArchivedPolicies />
      </div>
    </>
  );
}

const FILTERS = ['all', ...POLICY_STATUSES] as const;

/** The table, with a search and a tab for each status. Each tab says how many it holds. */
function PolicyList({ policies }: { policies: PolicyResponse[] }) {
  const t = useTranslations('policies');
  const [filters, setFilters] = useState(NO_POLICY_FILTERS);
  const searched = filterPolicies(policies, filters);
  const tabs: TabItem[] = FILTERS.map((filter) => {
    const rows = filter === 'all' ? searched : searched.filter((p) => p.status === filter);
    return {
      id: filter,
      label: t(`filters.${filter}`, { count: rows.length }),
      content: rows.length ? (
        <PolicyTable policies={rows} />
      ) : (
        <p className="text-body text-fg-muted">{t('empty')}</p>
      ),
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <PolicyFilterBar policies={policies} filters={filters} onChange={setFilters} />
      <Tabs tabs={tabs} />
    </div>
  );
}

function PoliciesHeader({ policies }: { policies: PolicyResponse[] }) {
  const t = useTranslations('policies');
  const tPage = useTranslations('pages.policies');
  const counts = statusCounts(policies);

  return (
    <PageHeader
      title={tPage('title')}
      description={t('summary', {
        total: policies.length,
        approved: counts.approved,
        review: counts.in_review,
        draft: counts.draft,
      })}
      actions={
        <div className="flex items-center gap-2">
          <AddPolicyButton />
          <WhereFromButton policyCount={policies.length} />
        </div>
      }
    />
  );
}

function PolicyTable({ policies }: { policies: PolicyResponse[] }) {
  const t = useTranslations('policies.columns');

  return (
    <Table aria-label={t('policy')}>
      <TableHeader>
        <TableColumn isRowHeader>{t('policy')}</TableColumn>
        <TableColumn className="w-32">{t('status')}</TableColumn>
        <TableColumn className="w-40">{t('owner')}</TableColumn>
        <TableColumn className="w-48">{t('approver')}</TableColumn>
        <TableColumn className="w-32">{t('review')}</TableColumn>
        <TableColumn className="w-24">{t('controls')}</TableColumn>
      </TableHeader>
      <TableBody>
        {policies.map((policy) => (
          <PolicyRow key={policy.id} policy={policy} />
        ))}
      </TableBody>
    </Table>
  );
}

function PolicyRow({ policy }: { policy: PolicyResponse }) {
  const tJobs = useTranslations('jobRoles');
  const reviewCadence = useReviewCadence();

  return (
    <TableRow id={policy.id}>
      <TableCell>
        <Link
          href={`/policies/${policy.id}`}
          className="font-medium text-fg hover:text-brand hover:underline"
        >
          {policyLabel(policy)}
        </Link>
        <p className="mt-0.5 line-clamp-1 text-label text-fg-muted">{policy.summary}</p>
      </TableCell>
      <TableCell>
        <PolicyStatusBadge status={policy.status} />
      </TableCell>
      <TableCell className="text-fg-muted">{tJobs(policy.ownerRole)}</TableCell>
      <TableCell className="text-fg-muted">{approverOf(policy)}</TableCell>
      <TableCell className="text-fg-muted">{reviewCadence(policy.reviewEvery)}</TableCell>
      <TableCell className="text-fg-muted tabular-nums">{policy.controlCount}</TableCell>
    </TableRow>
  );
}

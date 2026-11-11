'use client';

import { useTranslations } from 'next-intl';
import { useCan } from '@/components/providers/user-provider';
import { Alert } from '@/components/base/alert/alert';
import { PageHeader } from '@/components/base/page-header/page-header';
import { useGetFrameworksQuery, useGetPoliciesQuery } from '@/lib/api/frameworks-api';
import { useGetProofOverviewQuery } from '@/lib/api/evidence-api';
import { dashboardAttention, overall } from '@/lib/dashboard-stats';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { statusCounts } from '@/lib/policy-stats';
import { AttentionCard } from './attention-card';
import { FrameworksCard } from './frameworks-card';
import { ReadinessHero } from './readiness-hero';
import { RecentActivityCard } from './recent-activity-card';
import { TeamLoadCard } from './team-load-card';
import { WorkPreview } from './work-preview';

/** Where the company stands today: readiness, what needs attention, and what is waiting on you. */
export function DashboardPage() {
  const t = useTranslations('home');
  const { isAdmin } = useCan();

  return (
    <>
      <PageHeader title={t('heading')} description={t('tagline')} />
      <div className="flex flex-col gap-5">
        <TopRow />
        <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
          <FrameworksRow />
          <WorkPreview />
        </div>
        {isAdmin && (
          <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
            <TeamLoadCard />
            <RecentActivityCard />
          </div>
        )}
      </div>
    </>
  );
}

/** How ready the company is, next to what most needs someone. */
function TopRow() {
  const errorMessage = useErrorMessage();
  const frameworks = useGetFrameworksQuery();
  const policies = useGetPoliciesQuery();
  // The five most overdue items for the attention list; the counts in the answer cover all proof.
  const proof = useGetProofOverviewQuery({ tab: 'overdue', limit: 5 });
  const error = frameworks.error ?? policies.error ?? proof.error;

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!frameworks.data || !policies.data || !proof.data) return null;
  const counts = statusCounts(policies.data.policies);
  const total = counts.approved + counts.in_review + counts.draft;

  return (
    <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
      <ReadinessHero
        overall={overall(frameworks.data.frameworks)}
        frameworkCount={frameworks.data.frameworks.length}
        policies={{ approved: counts.approved, total }}
        proof={{
          total: proof.data.counts.all,
          provided: proof.data.counts.provided,
          overdue: proof.data.counts.overdue,
        }}
      />
      <AttentionCard items={dashboardAttention(policies.data.policies, proof.data.items)} />
    </div>
  );
}

function FrameworksRow() {
  const { data } = useGetFrameworksQuery();
  return data ? <FrameworksCard frameworks={data.frameworks} /> : null;
}

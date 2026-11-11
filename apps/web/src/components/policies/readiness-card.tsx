'use client';

import { POLICY_STATUSES, type PolicyStatus } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { HeroFact, HeroFacts, HeroPanel } from '@/components/base/hero-panel/hero-panel';
import { percentOf } from '@/lib/percent';
import type { StatusCounts } from '@/lib/policy-stats';

/** The dot beside each status on the gradient. Approved is solid, in review is warm, draft is faint. */
const DOTS: Record<PolicyStatus, string> = {
  approved: 'bg-on-brand',
  in_review: 'bg-on-brand-warm',
  draft: 'bg-on-brand-dim',
};

const totalOf = (counts: StatusCounts): number =>
  POLICY_STATUSES.reduce((sum, status) => sum + counts[status], 0);

/** How close the company is to having every policy signed off: one big gauge, and where the rest are. */
export function ReadinessCard({ counts }: { counts: StatusCounts }) {
  const t = useTranslations('policies.readiness');
  const tStatus = useTranslations('policies.status');
  const total = totalOf(counts);

  return (
    <HeroPanel
      tag={t('tag')}
      percent={percentOf(counts.approved, total)}
      gaugeLabel={t('summary', { approved: counts.approved, total })}
      title={t('title')}
      text={t('text', { approved: counts.approved, total })}
    >
      <HeroFacts>
        {POLICY_STATUSES.map((status) => (
          <HeroFact
            key={status}
            label={tStatus(status)}
            value={String(counts[status])}
            dot={DOTS[status]}
          />
        ))}
      </HeroFacts>
    </HeroPanel>
  );
}

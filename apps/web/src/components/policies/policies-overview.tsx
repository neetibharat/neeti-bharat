'use client';

import type { PolicyResponse } from '@neeti-bharat/shared';
import { countsByOwner, statusCounts } from '@/lib/policy-stats';
import { AttentionCard } from './attention-card';
import { OwnerBars } from './owner-bars';
import { ReadinessCard } from './readiness-card';

/** Above the list: how ready the policies are, what needs doing now, and who owns what. */
export function PoliciesOverview({ policies }: { policies: PolicyResponse[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[repeat(5,minmax(0,1fr))]">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] lg:col-span-2">
        <ReadinessCard counts={statusCounts(policies)} />
      </div>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] lg:col-span-3">
        <AttentionCard policies={policies} />
      </div>
      <div className="min-w-0 lg:col-span-5">
        <OwnerBars owners={countsByOwner(policies)} />
      </div>
    </div>
  );
}

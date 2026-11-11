'use client';

import type { RequirementControlResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import { Card } from '@/components/base/card/card';
import { ControlStatusBadge } from '@/components/frameworks/control-status-badge';
import { Link } from '@/i18n/navigation';

/** What this proof is for: the control it belongs to, and the policies that control answers to. */
export function RequirementMappings({ control }: { control: RequirementControlResponse }) {
  const t = useTranslations('proofPage.mappings');

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title={t('control')} description={t('controlHint')}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/frameworks/${control.frameworkId}/rules/${control.requirementId}`}
              className="text-body font-medium text-brand hover:underline"
            >
              {control.title}
            </Link>
            <p className="mt-0.5 text-label text-fg-muted">{control.description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge>{control.requirementId}</Badge>
            <ControlStatusBadge status={control.status} />
          </div>
        </div>
      </Card>
      <Card title={t('policies')} description={t('policiesHint')}>
        {control.policies.length === 0 ? (
          <p className="text-body text-fg-muted">{t('noPolicies')}</p>
        ) : (
          <ul className="divide-y divide-line rounded-control border border-line">
            {control.policies.map((policy) => (
              <li key={policy.id} className="px-3 py-2.5 text-body">
                <Link href={`/policies/${policy.id}`} className="text-brand hover:underline">
                  {policy.id} · {policy.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

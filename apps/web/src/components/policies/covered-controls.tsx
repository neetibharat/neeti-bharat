'use client';

import type { PolicyCoverageItem } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Badge } from '@/components/base/badge/badge';
import { Card } from '@/components/base/card/card';
import { ControlStatusBadge } from '@/components/frameworks/control-status-badge';
import { Link } from '@/i18n/navigation';
import { useGetPolicyCoverageQuery } from '@/lib/api/framework-edit-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/** The controls this policy answers, in every framework, with where each stands. Each links to its rule. */
export function CoveredControls({ policyId }: { policyId: string }) {
  const t = useTranslations('policies.covers');
  const errorMessage = useErrorMessage();
  const { data, error } = useGetPolicyCoverageQuery(policyId);
  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;

  return (
    <Card title={t('title')} description={t('description')}>
      {data && data.items.length === 0 && <p className="text-body text-fg-muted">{t('empty')}</p>}
      <ul className="divide-y divide-line">
        {(data?.items ?? []).map((item) => (
          <CoveredRow key={item.control.id} item={item} />
        ))}
      </ul>
    </Card>
  );
}

function CoveredRow({ item }: { item: PolicyCoverageItem }) {
  const { framework, rule, control } = item;

  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-body text-fg">{control.title}</p>
        <Link
          href={`/frameworks/${encodeURIComponent(framework.id)}/rules/${encodeURIComponent(rule.id)}`}
          className="text-label text-fg-muted underline-offset-2 hover:text-brand hover:underline"
        >
          {framework.name} · {rule.reference} · {rule.title}
        </Link>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge>{framework.seal}</Badge>
        <ControlStatusBadge status={control.status} />
      </div>
    </li>
  );
}

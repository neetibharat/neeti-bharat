'use client';

import type { ProofItemResponse } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Badge } from '@/components/base/badge/badge';
import { Card } from '@/components/base/card/card';
import { Loading } from '@/components/base/loading/loading';
import { ProofStatusBadge } from '@/components/proof/proof-status-badge';
import { Link } from '@/i18n/navigation';
import { useGetProofOverviewQuery } from '@/lib/api/evidence-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/** A policy covers a handful of controls, so one request holds all of their proof. */
const ALL_PROOF = { tab: 'all', page: 1, limit: 100 } as const;

/** What the controls this policy covers need proof of, and where each piece stands. Each opens its own page. */
export function PolicyProof({ policyId }: { policyId: string }) {
  const t = useTranslations('policies.evidence');
  const errorMessage = useErrorMessage();
  const { data, error } = useGetProofOverviewQuery({ ...ALL_PROOF, policyId });

  return (
    <Card title={t('title')} description={t('description')}>
      {error ? (
        <Alert tone="error">{errorMessage(error)}</Alert>
      ) : !data ? (
        <Loading className="min-h-24" />
      ) : data.items.length === 0 ? (
        <p className="text-body text-fg-muted">{t('empty')}</p>
      ) : (
        <ul className="divide-y divide-line">
          {data.items.map((item) => (
            <ProofRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function ProofRow({ item }: { item: ProofItemResponse }) {
  const t = useTranslations('proofPage');
  const tProof = useTranslations('frameworks.proof');

  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <Link
          href={`/proof/${item.id}`}
          className="text-body text-fg hover:text-brand hover:underline"
        >
          {item.title}
        </Link>
        <p className="text-label text-fg-muted">
          {item.controlTitle} · {tProof(`frequencies.${item.frequency}`)}
        </p>
      </div>
      <span className="flex shrink-0 flex-wrap justify-end gap-1">
        <ProofStatusBadge status={item.status} />
        {item.overdue && <Badge color="danger">{t('overdueBadge')}</Badge>}
      </span>
    </li>
  );
}

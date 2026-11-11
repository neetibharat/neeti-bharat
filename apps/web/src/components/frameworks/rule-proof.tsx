'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { ProofList } from '@/components/proof/proof-list';
import { useGetProofOverviewQuery } from '@/lib/api/evidence-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { NO_FILTERS, toProofQuery } from '@/lib/proof-query';

/** The proof behind this rule's controls, the most urgent first, a page at a time. A title opens that proof. */
export function RuleProof({ ruleId }: { ruleId: string }) {
  const t = useTranslations('frameworks.rulePage.proof');
  const errorMessage = useErrorMessage();
  const [page, setPage] = useState(1);
  const { data, error } = useGetProofOverviewQuery(
    toProofQuery({ filters: { ...NO_FILTERS, ruleId }, tab: 'all', page }),
  );

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return null;
  if (data.total === 0) return <p className="text-body text-fg-muted">{t('empty')}</p>;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-label text-fg-muted">{t('hint')}</p>
      <ProofList data={data} onPage={setPage} />
    </div>
  );
}

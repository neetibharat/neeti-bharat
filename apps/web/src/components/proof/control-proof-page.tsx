'use client';

import { IconChevronLeft } from '@tabler/icons-react';
import type { EvidenceListResponse, ProofOverviewResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Badge } from '@/components/base/badge/badge';
import { Card } from '@/components/base/card/card';
import { PageHeader } from '@/components/base/page-header/page-header';
import { PageSkeleton } from '@/components/base/skeleton/skeleton';
import { Tabs, type TabItem } from '@/components/base/tabs/tabs';
import { ArchivedRequirements } from '@/components/proof/archived-requirements';
import { useCan } from '@/components/providers/user-provider';
import { Link } from '@/i18n/navigation';
import { useGetEvidenceQuery, useGetProofOverviewQuery } from '@/lib/api/evidence-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { NO_FILTERS, toProofQuery } from '@/lib/proof-query';
import { AddRequirementButton } from './add-requirement-button';
import { GeneralProof } from './general-proof';
import { ProofList } from './proof-list';
import { ProofSummary } from './proof-summary';

type TabId = 'requirements' | 'other' | 'archived';

function BackLink() {
  const t = useTranslations('proofPage.control');

  return (
    <Link
      href="/proof"
      className="mb-3 inline-flex items-center gap-1 text-label font-medium text-fg-muted hover:text-fg"
    >
      <IconChevronLeft className="size-4" />
      {t('back')}
    </Link>
  );
}

function useControlTabs(props: {
  controlId: string;
  proof: ProofOverviewResponse;
  evidence: EvidenceListResponse | undefined;
  onPage: (page: number) => void;
}): TabItem<TabId>[] {
  const t = useTranslations('proofPage.control.tabs');
  const { controlId, proof, evidence, onPage } = props;
  const tabs: TabItem<TabId>[] = [
    {
      id: 'requirements',
      label: t('requirements', { count: proof.counts.all }),
      content: <ProofList data={proof} onPage={onPage} />,
    },
    {
      id: 'other',
      label: t('other', { count: evidence?.other.length ?? 0 }),
      content: <GeneralProof controlId={controlId} proof={evidence?.other ?? []} />,
    },
  ];
  if (evidence && evidence.archived.length > 0) {
    tabs.push({
      id: 'archived',
      label: t('archived', { count: evidence.archived.length }),
      content: (
        <Card>
          <ArchivedRequirements requirements={evidence.archived} />
        </Card>
      ),
    });
  }
  return tabs;
}

/**
 * One control's proof on a page of its own: its name as the title, a way back to all proof, and tabs for its
 * requirements, the proof that is not for any requirement, and the requirements that were archived.
 */
export function ControlProofPage({ controlId }: { controlId: string }) {
  const t = useTranslations('proofPage.control');
  const errorMessage = useErrorMessage();
  const { canEdit } = useCan();
  const [page, setPage] = useState(1);
  const proof = useGetProofOverviewQuery(
    toProofQuery({ filters: NO_FILTERS, tab: 'all', page, controlId }),
  );
  const evidence = useGetEvidenceQuery(controlId);
  const tabs = useControlTabs({
    controlId,
    proof: proof.data ?? EMPTY,
    evidence: evidence.data,
    onPage: setPage,
  });

  if (proof.error) return <Alert tone="error">{errorMessage(proof.error)}</Alert>;
  if (!proof.data) return <PageSkeleton />;
  const { control } = proof.data;

  return (
    <>
      <BackLink />
      <PageHeader
        title={control?.title ?? t('fallback')}
        description={t('showing')}
        actions={
          <div className="flex items-center gap-3">
            {control && <Badge>{control.ruleId}</Badge>}
            {canEdit && <AddRequirementButton controlId={controlId} />}
          </div>
        }
      />
      <div className="flex flex-col gap-4">
        <ProofSummary counts={proof.data.counts} />
        <Tabs tabs={tabs} />
      </div>
    </>
  );
}

const EMPTY: ProofOverviewResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 25,
  counts: { all: 0, overdue: 0, missing: 0, due: 0, provided: 0 },
  rules: [],
  control: null,
};

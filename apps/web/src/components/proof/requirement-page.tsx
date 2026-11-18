'use client';

import { IconChevronLeft } from '@tabler/icons-react';
import type { ProofRequirementDetailResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useCan } from '@/components/providers/user-provider';
import { Alert } from '@/components/base/alert/alert';
import { Loading } from '@/components/base/loading/loading';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Tabs } from '@/components/base/tabs/tabs';
import { Link } from '@/i18n/navigation';
import { useGetRequirementQuery } from '@/lib/api/evidence-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { RequirementActions } from './requirement-actions';
import { RequirementMappings } from './requirement-mappings';
import { RequirementProof } from './requirement-proof';
import { RequirementSettings } from './requirement-settings';

function BackLink({ controlId }: { controlId?: string }) {
  const t = useTranslations('proofPage');
  return (
    <Link
      href={controlId ? `/proof?control=${encodeURIComponent(controlId)}` : '/proof'}
      className="mb-3 inline-flex items-center gap-1 text-label font-medium text-fg-muted hover:text-fg"
    >
      <IconChevronLeft className="size-4" />
      {t('back')}
    </Link>
  );
}

/** One thing that needs proof, on its own page: who collects it and by when, the proof given, and what it is for. */
export function RequirementPage({ requirementId }: { requirementId: string }) {
  const errorMessage = useErrorMessage();
  const { data, error } = useGetRequirementQuery(requirementId);

  if (error) {
    return (
      <>
        <BackLink />
        <Alert tone="error">{errorMessage(error)}</Alert>
      </>
    );
  }
  if (!data) return <Loading />;

  return <Body data={data} />;
}

function Body({ data }: { data: ProofRequirementDetailResponse }) {
  const t = useTranslations('proofPage.tabs');
  const { canEdit } = useCan();
  return (
    <>
      <BackLink controlId={data.control.id} />
      <PageHeader
        title={data.requirement.title}
        description={data.requirement.description || undefined}
        actions={
          canEdit ? (
            <RequirementActions requirement={data.requirement} controlId={data.control.id} />
          ) : undefined
        }
      />
      <Tabs
        tabs={[
          {
            id: 'overview',
            label: t('overview'),
            content: <Overview data={data} />,
          },
          {
            id: 'mappings',
            label: t('mappings'),
            content: <RequirementMappings control={data.control} />,
          },
        ]}
      />
    </>
  );
}

function Overview({ data }: { data: ProofRequirementDetailResponse }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <RequirementSettings requirement={data.requirement} />
      <RequirementProof controlId={data.control.id} requirement={data.requirement} />
    </div>
  );
}

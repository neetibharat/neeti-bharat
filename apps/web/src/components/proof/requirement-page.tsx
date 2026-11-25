'use client';

import type { ProofRequirementDetailResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useCan } from '@/components/providers/user-provider';
import { Alert } from '@/components/base/alert/alert';
import { LinkedText } from '@/components/base/linked-text/linked-text';
import { Loading } from '@/components/base/loading/loading';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Tabs } from '@/components/base/tabs/tabs';
import { useGetRequirementQuery } from '@/lib/api/evidence-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { Breadcrumb } from '@/components/base/breadcrumb/breadcrumb';
import { RequirementActions } from './requirement-actions';
import { RequirementMappings } from './requirement-mappings';
import { RequirementProof } from './requirement-proof';
import { RequirementSettings } from './requirement-settings';

/** One thing that needs proof, on its own page: who collects it and by when, the proof given, and what it is for. */
export function RequirementPage({ requirementId }: { requirementId: string }) {
  const t = useTranslations('proofPage');
  const errorMessage = useErrorMessage();
  const { data, error } = useGetRequirementQuery(requirementId);

  if (error) {
    return (
      <>
        <Breadcrumb crumbs={[{ label: t('back'), href: '/proof' }]} />
        <Alert tone="error">{errorMessage(error)}</Alert>
      </>
    );
  }
  if (!data) return <Loading />;

  return <Body data={data} />;
}

/** The breadcrumb up through the control, and the requirement's title labelled as a requirement. */
function Header({ data }: { data: ProofRequirementDetailResponse }) {
  const t = useTranslations('proofPage');
  const { canEdit } = useCan();

  return (
    <>
      <Breadcrumb
        crumbs={[
          { label: t('back'), href: '/proof' },
          {
            label: data.control.title,
            href: `/proof?control=${encodeURIComponent(data.control.id)}`,
          },
          { label: data.requirement.title },
        ]}
      />
      <PageHeader
        title={data.requirement.title}
        description={
          data.requirement.description ? (
            <LinkedText text={data.requirement.description} />
          ) : undefined
        }
        actions={
          canEdit ? (
            <RequirementActions requirement={data.requirement} controlId={data.control.id} />
          ) : undefined
        }
      />
    </>
  );
}

function Body({ data }: { data: ProofRequirementDetailResponse }) {
  const t = useTranslations('proofPage.tabs');

  return (
    <>
      <Header data={data} />
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

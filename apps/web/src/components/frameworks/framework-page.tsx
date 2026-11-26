'use client';

import { IconChevronLeft, IconInfoCircle } from '@tabler/icons-react';
import { DPDP_FRAMEWORK_ID, isLocked, type ChecklistResponse } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Loading } from '@/components/base/loading/loading';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Tabs, type TabItem } from '@/components/base/tabs/tabs';
import { useCan } from '@/components/providers/user-provider';
import { Link } from '@/i18n/navigation';
import { useGetChecklistQuery } from '@/lib/api/frameworks-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { ArchivedControls } from './archived-controls';
import { FrameworkSummary } from './framework-summary';
import { FrameworkActions } from './framework-actions';
import { RulesTab } from './rules-tab';
import { SetupCard } from './setup-card';

interface TabLabels {
  rules: string;
  setup: string;
  archived: string;
}

/**
 * The rules always; the set-up for admins, on the framework it belongs to; the archived controls for anyone who can
 * edit. The set-up answers switch DPDP's rules on and off, so other frameworks have no set-up tab.
 */
function frameworkTabs(
  data: ChecklistResponse,
  labels: TabLabels,
  access: { canEdit: boolean; hasSetup: boolean },
): TabItem[] {
  const rules = {
    id: 'rules',
    label: labels.rules,
    content: <RulesTab framework={data.framework} rules={data.rules} />,
  };
  const setup = { id: 'setup', label: labels.setup, content: <SetupCard /> };
  const archived = {
    id: 'archived',
    label: labels.archived,
    content: <ArchivedControls controls={data.archived} />,
  };
  return [rules, ...(access.hasSetup ? [setup] : []), ...(access.canEdit ? [archived] : [])];
}

/** One framework: a summary, then tabs for the rules, the set-up and the archived controls. */
export function FrameworkPage({ frameworkId }: { frameworkId: string }) {
  const t = useTranslations('frameworks');
  const tTabs = useTranslations('frameworks.tabs');
  const errorMessage = useErrorMessage();
  const { canEdit, isAdmin } = useCan();
  const { data, error } = useGetChecklistQuery(frameworkId);

  if (error) return <Failure message={errorMessage(error)} />;
  if (!data) return <Loading />;
  const labels = {
    rules: tTabs('rules'),
    setup: tTabs('setup'),
    archived: tTabs('archived', { count: data.archived.length }),
  };
  const hasSetup = isAdmin && data.framework.id === DPDP_FRAMEWORK_ID;

  return (
    <>
      <BackLink />
      <PageHeader
        title={data.framework.name}
        description={t('description')}
        actions={
          canEdit && !isLocked(data.framework.isBuiltIn) ? (
            <FrameworkActions framework={data.framework} />
          ) : undefined
        }
      />
      <div className="flex flex-col gap-4">
        <FrameworkSummary framework={data.framework} rules={data.rules} />
        {data.framework.isBuiltIn && <ReviewNote />}
        <Tabs tabs={frameworkTabs(data, labels, { canEdit, hasSetup })} />
      </div>
    </>
  );
}

function ReviewNote() {
  const t = useTranslations('frameworks');

  return (
    <p className="flex items-start gap-2 text-caption text-fg-muted">
      <IconInfoCircle className="mt-px size-4 shrink-0" />
      {t('reviewNote')}
    </p>
  );
}

function BackLink() {
  const t = useTranslations('frameworks');

  return (
    <Link
      href="/frameworks"
      className="mb-3 inline-flex items-center gap-1 text-label font-medium text-fg-muted hover:text-fg"
    >
      <IconChevronLeft className="size-4" />
      {t('back')}
    </Link>
  );
}

function Failure({ message }: { message: string }) {
  return (
    <>
      <BackLink />
      <Alert tone="error">{message}</Alert>
    </>
  );
}

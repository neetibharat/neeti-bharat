'use client';

import { IconChevronLeft } from '@tabler/icons-react';
import {
  DPDP_FRAMEWORK_ID,
  isLocked,
  type PolicyResponse,
  type ProofCounts,
  type RuleResponse,
} from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Badge } from '@/components/base/badge/badge';
import { Loading } from '@/components/base/loading/loading';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Tabs } from '@/components/base/tabs/tabs';
import { Link } from '@/i18n/navigation';
import { useGetProofOverviewQuery } from '@/lib/api/evidence-api';
import { useGetRulePageQuery } from '@/lib/api/frameworks-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { ruleHeading } from '@/lib/rule-progress';
import { NO_FILTERS, toProofQuery } from '@/lib/proof-query';
import { policiesOfRule, ruleStats } from '@/lib/rule-stats';
import { DownloadButton } from '@/components/exports/download-button';
import { evidencePackPath } from '@/components/exports/evidence-packs';
import { RuleActions } from './rule-actions';
import { RuleControls } from './rule-controls';
import { RulePillars } from './rule-pillars';
import { RulePolicies } from './rule-policies';
import { RuleProof } from './rule-proof';

function BackLink({ frameworkId }: { frameworkId: string }) {
  const t = useTranslations('frameworks.rulePage');
  return (
    <Link
      href={`/frameworks/${encodeURIComponent(frameworkId)}`}
      className="mb-3 inline-flex items-center gap-1 text-label font-medium text-fg-muted hover:text-fg"
    >
      <IconChevronLeft className="size-4" />
      {t('back')}
    </Link>
  );
}

/** One rule on its own page: how far along it is, then what it is made of, split into controls, policies and proof. */
export function RulePage(props: { frameworkId: string; ruleId: string; canEdit: boolean }) {
  const { frameworkId, ruleId, canEdit } = props;
  const errorMessage = useErrorMessage();
  const page = useGetRulePageQuery({ frameworkId, ruleId });
  // Only the counts are used here: the proof tab fetches its own pages.
  const proof = useGetProofOverviewQuery(
    toProofQuery({ filters: { ...NO_FILTERS, ruleId }, tab: 'all', page: 1 }),
  );
  const error = page.error ?? proof.error;

  if (error) return <Failure frameworkId={frameworkId} message={errorMessage(error)} />;
  if (!page.data || !proof.data) return <Loading />;

  return (
    <Body
      rule={page.data.rule}
      policies={page.data.policies}
      proof={proof.data.counts}
      canEdit={canEdit}
    />
  );
}

function Failure({ message, frameworkId }: { message: string; frameworkId: string }) {
  return (
    <>
      <BackLink frameworkId={frameworkId} />
      <Alert tone="error">{message}</Alert>
    </>
  );
}

interface BodyProps {
  rule: RuleResponse;
  policies: PolicyResponse[];
  proof: ProofCounts;
  canEdit: boolean;
}

function Body({ rule, policies, proof, canEdit }: BodyProps) {
  const t = useTranslations('frameworks');
  const rulePolicies = policiesOfRule(rule, policies);

  return (
    <>
      <BackLink frameworkId={rule.frameworkId} />
      <PageHeader
        title={ruleHeading(rule)}
        description={rule.summary}
        actions={<RuleHeaderActions rule={rule} canEdit={canEdit} />}
      />
      <div className="flex flex-col gap-4">
        {!rule.applies && <Alert tone="info">{t('rulePage.notApplicable')}</Alert>}
        <RulePillars stats={ruleStats(rule, policies, proof)} />
        <RuleTabs rule={rule} policies={rulePolicies} proofCount={proof.all} canEdit={canEdit} />
      </div>
    </>
  );
}

/** What sits beside the title: the condition that switches the rule on, and change or archive unless the rule is locked. */
function RuleHeaderActions({ rule, canEdit }: { rule: RuleResponse; canEdit: boolean }) {
  const t = useTranslations('frameworks');
  const condition =
    rule.appliesWhen !== 'always' ? (
      <Badge color="warning">{t(`appliesWhen.${rule.appliesWhen}`)}</Badge>
    ) : null;
  const canChange = canEdit && !isLocked(rule.frameworkId === DPDP_FRAMEWORK_ID);

  return (
    <div className="flex items-center gap-3">
      {condition}
      <DownloadButton
        path={evidencePackPath(rule.frameworkId, rule.id)}
        fallbackName={`evidence-pack-${rule.reference}.zip`}
        label={t('rulePage.evidencePack')}
        color="secondary"
      />
      {canChange && <RuleActions rule={rule} />}
    </div>
  );
}

interface TabsProps {
  rule: RuleResponse;
  policies: PolicyResponse[];
  proofCount: number;
  canEdit: boolean;
}

/** Controls, policies and proof as three tabs, each with how many it holds. */
function RuleTabs({ rule, policies, proofCount, canEdit }: TabsProps) {
  const t = useTranslations('frameworks.rulePage.tabs');

  return (
    <Tabs
      tabs={[
        {
          id: 'controls',
          label: t('controls', { count: rule.controls.length }),
          content: <RuleControls rule={rule} canEdit={canEdit} />,
        },
        {
          id: 'policies',
          label: t('policies', { count: policies.length }),
          content: <RulePolicies rule={rule} policies={policies} />,
        },
        {
          id: 'proof',
          label: t('proof', { count: proofCount }),
          content: <RuleProof ruleId={rule.id} />,
        },
      ]}
    />
  );
}

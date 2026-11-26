'use client';

import { IconWand } from '@tabler/icons-react';
import {
  AI_CONTEXT_MAX_LENGTH,
  customAnswerLabel,
  type PolicyDetailResponse,
  type PolicyTailorResponse,
} from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Textarea } from '@/components/base/textarea/textarea';
import { useCan } from '@/components/providers/user-provider';
import { Link } from '@/i18n/navigation';
import { useGetAiSettingsQuery } from '@/lib/api/ai-api';
import { useTailorPolicyMutation } from '@/lib/api/ai-tools-api';
import { useSavePolicyContentMutation } from '@/lib/api/policy-edit-api';
import { featureAvailable } from '@/lib/ai-features';
import { isProfileKey } from '@/lib/guards';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { useRememberedText } from '@/lib/hooks/use-remembered-text';
import { changedLines, diffRows, plainLine, policyLines } from '@/lib/policy-diff';
import { AiDialog } from './ai-dialog';
import { PolicyDiffView } from './policy-diff-view';

function useAnswerLabel() {
  const tFields = useTranslations('profile.fields');
  return (key: string) => (isProfileKey(key) ? tFields(`${key}.label`) : customAnswerLabel(key));
}

function Changes({ changes }: { changes: string[] }) {
  const t = useTranslations('aiTools.tailor');
  if (changes.length === 0) return <p className="text-body text-fg-muted">{t('noReasons')}</p>;

  return (
    <section>
      <ul className="list-disc pl-5 text-body text-fg-muted">
        {changes.map((change) => (
          <li key={change}>{change}</li>
        ))}
      </ul>
    </section>
  );
}

function MissingAnswers({ keys }: { keys: string[] }) {
  const t = useTranslations('aiTools.tailor');
  const labelOf = useAnswerLabel();
  if (keys.length === 0) return null;

  return (
    <Alert>
      {t('missing', { answers: keys.map(labelOf).join(', ') })}{' '}
      <Link href="/settings/company-profile" className="font-medium underline">
        {t('openProfile')}
      </Link>
    </Alert>
  );
}

interface ProposalProps {
  policy: PolicyDetailResponse;
  result: PolicyTailorResponse;
  close: () => void;
  /** Go back to the first step, to add detail and run it again. */
  retry: () => void;
}

/** The AI left the text as it is, so there is nothing to replace. */
function Unchanged({ result, close, retry }: Pick<ProposalProps, 'result' | 'close' | 'retry'>) {
  const t = useTranslations('aiTools.tailor');

  return (
    <div className="flex flex-col gap-4">
      <Alert tone="success">{t('unchanged')}</Alert>
      <MissingAnswers keys={result.missingAnswers} />
      <div className="flex justify-end gap-2">
        <Button color="secondary" onPress={close}>
          {t('close')}
        </Button>
        <Button onPress={retry}>{t('addDetail')}</Button>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="mb-2 text-label font-semibold tracking-wide text-fg-subtle uppercase">
      {children}
    </h3>
  );
}

/** Two sections side by side: what changed and why on the left, the changes line by line on the right. They stack on a narrow screen. */
function ProposalSections(props: {
  result: PolicyTailorResponse;
  before: string[];
  after: string[];
  values: PolicyDetailResponse['values'];
  count: number;
}) {
  const t = useTranslations('aiTools.tailor');
  const { result, before, after, values, count } = props;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)]">
      <section className="flex max-h-[52vh] min-w-0 flex-col gap-4 overflow-y-auto pr-1">
        <div>
          <SectionTitle>{t('sectionSummary')}</SectionTitle>
          <Changes changes={result.changes} />
        </div>
        <MissingAnswers keys={result.missingAnswers} />
      </section>
      <section className="min-w-0">
        <SectionTitle>{t('sectionChanges', { count })}</SectionTitle>
        <PolicyDiffView before={before} after={after} values={values} />
      </section>
    </div>
  );
}

/** What the rewrite changed, shown against the text now, with the choice to replace it or leave it. */
function Proposal({ policy, result, close, retry }: ProposalProps) {
  const t = useTranslations('aiTools.tailor');
  const errorMessage = useErrorMessage();
  const [save, { isLoading, error }] = useSavePolicyContentMutation();
  const before = useMemo(() => policyLines(policy.content), [policy.content]);
  const after = useMemo(() => policyLines(result.content), [result.content]);
  const count = useMemo(
    () => changedLines(diffRows(before.map(plainLine), after.map(plainLine))),
    [before, after],
  );
  if (count === 0) return <Unchanged result={result} close={close} retry={retry} />;

  async function replace() {
    const saved = await save({ policyId: policy.id, content: result.content });
    if (!('error' in saved)) close();
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body text-fg">{t('summary', { count })}</p>
      <ProposalSections
        result={result}
        before={before}
        after={after}
        values={policy.values}
        count={count}
      />
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      <div className="flex justify-end gap-2">
        <Button color="secondary" onPress={close}>
          {t('discard')}
        </Button>
        <Button isLoading={isLoading} onPress={replace}>
          {t('replace')}
        </Button>
      </div>
    </div>
  );
}

/** A note about the company in the person's own words, kept in this browser so it is typed once for every policy. */
function CompanyNote({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useTranslations('aiTools.tailor');

  return (
    <Textarea
      label={t('contextLabel')}
      hint={t('contextHint')}
      placeholder={t('contextPlaceholder')}
      value={value}
      onChange={onChange}
      maxLength={AI_CONTEXT_MAX_LENGTH}
      rows={4}
    />
  );
}

/** Offers to rewrite a draft for the company, from its profile, its vendors and a note. The person reads it, then keeps it or drops it. */
export function TailorPolicyButton({ policy }: { policy: PolicyDetailResponse }) {
  const t = useTranslations('aiTools.tailor');
  const { canEdit } = useCan();
  const { data } = useGetAiSettingsQuery();
  const [tailor] = useTailorPolicyMutation();
  const [context, setContext] = useRememberedText('app_ai_company_note');
  if (policy.status !== 'draft' || !featureAvailable(data, 'policy_tailor', canEdit)) return null;

  return (
    <AiDialog<PolicyTailorResponse>
      size="2xl"
      title={t('title')}
      intro={t('intro')}
      sends={t('sends')}
      before={<CompanyNote value={context} onChange={setContext} />}
      trigger={
        <Button color="secondary" iconLeading={IconWand}>
          {t('button')}
        </Button>
      }
      run={() => tailor({ policyId: policy.id, context })}
    >
      {(result, close, retry) => (
        <Proposal policy={policy} result={result} close={close} retry={retry} />
      )}
    </AiDialog>
  );
}

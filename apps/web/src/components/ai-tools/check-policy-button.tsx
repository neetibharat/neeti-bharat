'use client';

import { IconChecklist } from '@tabler/icons-react';
import type {
  PolicyCheckControl,
  PolicyCheckResponse,
  PolicyCheckRule,
} from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { useCan } from '@/components/providers/user-provider';
import { useGetAiSettingsQuery } from '@/lib/api/ai-api';
import { useCheckPolicyMutation } from '@/lib/api/ai-tools-api';
import { featureAvailable } from '@/lib/ai-features';
import { AiDialog } from './ai-dialog';
import { useHumanise } from './use-humanise';
import { PolicyVerdictBadge } from './verdict-badge';

function ControlRow({ control }: { control: PolicyCheckControl }) {
  const t = useTranslations('aiTools.check');
  const humanise = useHumanise();

  return (
    <li className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <p className="text-body font-medium text-fg">{control.title}</p>
        <PolicyVerdictBadge verdict={control.verdict} />
      </div>
      {control.note && <p className="text-label text-fg-muted">{humanise(control.note)}</p>}
      {control.suggestion && (
        <p className="text-label text-fg">
          <span className="font-semibold">{t('suggestion')}</span> {humanise(control.suggestion)}
        </p>
      )}
    </li>
  );
}

function RuleGroup({ rule }: { rule: PolicyCheckRule }) {
  return (
    <section>
      <h3 className="mb-2 text-label font-semibold tracking-wide text-fg-subtle uppercase">
        {rule.reference} · {rule.title}
      </h3>
      <ul className="divide-y divide-line rounded-control border border-line px-4 py-3">
        {rule.controls.map((control) => (
          <ControlRow key={control.controlId} control={control} />
        ))}
      </ul>
    </section>
  );
}

function Result({ result, close }: { result: PolicyCheckResponse; close: () => void }) {
  const t = useTranslations('aiTools.check');
  const humanise = useHumanise();
  const controls = result.rules.flatMap((rule) => rule.controls);
  const count = (verdict: PolicyCheckControl['verdict']) =>
    controls.filter((control) => control.verdict === verdict).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex max-h-[58vh] flex-col gap-4 overflow-y-auto pr-1">
        <div>
          <p className="text-body text-fg">{humanise(result.summary)}</p>
          <p className="mt-1 text-label text-fg-muted">
            {t('counts', {
              covered: count('covered'),
              partly: count('partly'),
              missing: count('missing'),
            })}
          </p>
        </div>
        {result.rules.map((rule) => (
          <RuleGroup key={rule.ruleId} rule={rule} />
        ))}
        <p className="text-caption text-fg-subtle">{t('disclaimer')}</p>
      </div>
      <div className="flex justify-end">
        <Button color="secondary" onPress={close}>
          {t('close')}
        </Button>
      </div>
    </div>
  );
}

/** Reads a policy against the rules and controls it covers, and says what it leaves out. A second opinion, not a ruling. */
export function CheckPolicyButton({ policyId }: { policyId: string }) {
  const t = useTranslations('aiTools.check');
  const { canEdit } = useCan();
  const { data } = useGetAiSettingsQuery();
  const [check] = useCheckPolicyMutation();
  if (!featureAvailable(data, 'policy_check', canEdit)) return null;

  return (
    <AiDialog<PolicyCheckResponse>
      size="xl"
      title={t('title')}
      intro={t('intro')}
      sends={t('sends')}
      trigger={
        <Button color="secondary" iconLeading={IconChecklist}>
          {t('button')}
        </Button>
      }
      run={() => check(policyId)}
    >
      {(result, close) => <Result result={result} close={close} />}
    </AiDialog>
  );
}

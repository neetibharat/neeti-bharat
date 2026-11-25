'use client';

import { IconCalendar, IconCircleX, IconFile, IconSparkles, IconTag } from '@tabler/icons-react';
import type { EvidenceResponse, ProofCheckResponse, ProofCheckVerdict } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Button } from '@/components/base/button/button';
import { useCan } from '@/components/providers/user-provider';
import { useGetAiSettingsQuery } from '@/lib/api/ai-api';
import { useCheckProofMutation } from '@/lib/api/ai-tools-api';
import { featureAvailable } from '@/lib/ai-features';
import { cx } from '@/lib/utils/cx';
import { AiDialog } from './ai-dialog';
import { useHumanise } from './use-humanise';
import { ProofVerdictBadge } from './verdict-badge';

const HEAD: Record<ProofCheckVerdict, string> = {
  matches: 'border-success/30 bg-success-soft',
  partly: 'border-accent/30 bg-accent-soft',
  does_not_match: 'border-danger/30 bg-danger-soft',
  unclear: 'border-line bg-surface-muted',
};

/** The verdict, large, with what proof it is about and why in the AI's words. */
function Verdict({ result, title }: { result: ProofCheckResponse; title: string }) {
  const t = useTranslations('aiTools.proof');
  const humanise = useHumanise();

  return (
    <div className={cx('flex flex-col gap-2 rounded-control border p-4', HEAD[result.verdict])}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-2 text-label text-fg-muted">
          <IconFile className="size-4 shrink-0" />
          <span className="truncate">{title}</span>
        </p>
        <ProofVerdictBadge verdict={result.verdict} />
      </div>
      <p className="text-subtitle font-semibold text-fg">{t(`headline.${result.verdict}`)}</p>
      <p className="text-body text-fg">{humanise(result.reason)}</p>
    </div>
  );
}

function Missing({ items }: { items: string[] }) {
  const t = useTranslations('aiTools.proof');
  const humanise = useHumanise();
  if (items.length === 0) return null;

  return (
    <section>
      <h3 className="mb-2 text-label font-semibold text-fg">
        {t('missing', { count: items.length })}
      </h3>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-body text-fg-muted">
            <IconCircleX className="mt-0.5 size-4 shrink-0 text-danger" />
            {humanise(item)}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-control border border-line px-3 py-2">
      <span className="mt-0.5 text-fg-subtle">{icon}</span>
      <div className="min-w-0">
        <p className="text-caption text-fg-subtle">{label}</p>
        <p className="text-body font-medium text-fg">{children}</p>
      </div>
    </div>
  );
}

function Facts({ result }: { result: ProofCheckResponse }) {
  const t = useTranslations('aiTools.proof');
  const format = useFormatter();
  if (!result.suggestedTitle && !result.dateOnDocument) return null;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {result.suggestedTitle && (
        <Fact icon={<IconTag className="size-4" />} label={t('suggestedTitle')}>
          {result.suggestedTitle}
        </Fact>
      )}
      {result.dateOnDocument && (
        <Fact icon={<IconCalendar className="size-4" />} label={t('dateOnDocument')}>
          {format.dateTime(new Date(`${result.dateOnDocument}T00:00:00Z`), {
            dateStyle: 'long',
            timeZone: 'UTC',
          })}
        </Fact>
      )}
    </div>
  );
}

function Result(props: { result: ProofCheckResponse; title: string; close: () => void }) {
  const t = useTranslations('aiTools.proof');

  return (
    <div className="flex flex-col gap-4">
      <Verdict result={props.result} title={props.title} />
      <Missing items={props.result.missing} />
      <Facts result={props.result} />
      <p className="text-caption text-fg-subtle">{t('disclaimer')}</p>
      <div className="flex justify-end">
        <Button color="secondary" onPress={props.close}>
          {t('close')}
        </Button>
      </div>
    </div>
  );
}

/** Reads one piece of proof against what it was added for. A picture or a link alone has no text, so it offers nothing. */
export function CheckProofButton(props: { controlId: string; item: EvidenceResponse }) {
  const t = useTranslations('aiTools.proof');
  const { canEdit } = useCan();
  const { data } = useGetAiSettingsQuery();
  const [check] = useCheckProofMutation();
  const { controlId, item } = props;
  if (item.kind === 'link' || !featureAvailable(data, 'proof_check', canEdit)) return null;

  return (
    <AiDialog<ProofCheckResponse>
      title={t('title')}
      intro={t('intro')}
      sends={t('sends')}
      trigger={
        <Button color="tertiary" size="sm" iconLeading={IconSparkles}>
          {t('button')}
        </Button>
      }
      run={() => check({ controlId, evidenceId: item.id })}
    >
      {(result, close) => <Result result={result} title={item.title} close={close} />}
    </AiDialog>
  );
}

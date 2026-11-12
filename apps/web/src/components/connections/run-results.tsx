'use client';

import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleDashed,
  IconCircleX,
  type Icon,
} from '@tabler/icons-react';
import {
  AZURE_CHECK_GROUPS,
  type ConnectionCheckResult,
  type ConnectionCheckStatus,
} from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Badge } from '@/components/base/badge/badge';
import { Card } from '@/components/base/card/card';
import { HeroFact, HeroFacts } from '@/components/base/hero-panel/hero-panel';
import { useGetConnectionRunQuery } from '@/lib/api/connections-api';
import { outcomeKey } from '@/lib/connections';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

const LOOK: Record<
  ConnectionCheckStatus,
  { icon: Icon; tone: string; badge: 'success' | 'warning' | 'danger' | 'gray' }
> = {
  pass: { icon: IconCircleCheck, tone: 'text-success', badge: 'success' },
  warn: { icon: IconAlertTriangle, tone: 'text-accent', badge: 'warning' },
  fail: { icon: IconCircleX, tone: 'text-danger', badge: 'danger' },
  skipped: { icon: IconCircleDashed, tone: 'text-fg-subtle', badge: 'gray' },
};

function ResultRow({ result }: { result: ConnectionCheckResult }) {
  const t = useTranslations('connections');
  const { icon: StatusIcon, tone, badge } = LOOK[result.status];
  // Which sentences exist depends on the check, and a test keeps en.json in step with the list of checks.
  const sentence = t as unknown as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const key = outcomeKey(result);
  const text = key.startsWith('skipped.')
    ? sentence(key, {})
    : sentence(`checks.${result.id}.${key}`, result.values ?? {});

  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <StatusIcon className={`mt-0.5 size-5 shrink-0 ${tone}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-body font-medium text-fg">{sentence(`checks.${result.id}.name`)}</p>
        <p className="text-label text-fg-muted">{text}</p>
      </div>
      <Badge color={badge}>{t(`status.${result.status}`)}</Badge>
    </li>
  );
}

function Group({ id, results }: { id: string; results: ConnectionCheckResult[] }) {
  const t = useTranslations('connections.groups');
  const needWork = results.filter((r) => r.status === 'warn' || r.status === 'fail').length;
  const sentence = t as unknown as (key: string, values?: Record<string, number>) => string;

  return (
    <Card
      title={sentence(`${id}.title`)}
      description={sentence(`${id}.about`)}
      actions={
        needWork > 0 ? <Badge color="gray">{t('needsWork', { count: needWork })}</Badge> : null
      }
    >
      <ul className="divide-y divide-line">
        {results.map((result) => (
          <ResultRow key={result.id} result={result} />
        ))}
      </ul>
    </Card>
  );
}

/** One run: how many checks passed, warned, failed and could not answer, then each check, in groups. */
export function RunResults({ runId }: { runId: string }) {
  const t = useTranslations('connections.results');
  const format = useFormatter();
  const errorMessage = useErrorMessage();
  const { data, error } = useGetConnectionRunQuery(runId);

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return null;
  const byId = new Map(data.results.map((result) => [result.id, result]));

  return (
    <div className="flex flex-col gap-4">
      <Card
        description={t('checked', {
          when: format.dateTime(new Date(data.ranAt), { dateStyle: 'medium', timeStyle: 'short' }),
          name: data.ranByName,
        })}
      >
        <HeroFacts>
          <HeroFact label={t('passed')} value={String(data.passed)} dot="bg-success" />
          <HeroFact label={t('warned')} value={String(data.warned)} dot="bg-accent" />
          <HeroFact
            label={t('failed')}
            value={String(data.failed)}
            dot="bg-danger"
            isAlert={data.failed > 0}
          />
          <HeroFact label={t('skipped')} value={String(data.skipped)} dot="bg-line-strong" />
        </HeroFacts>
      </Card>
      {AZURE_CHECK_GROUPS.map((group) => {
        const found = group.checks.flatMap((id) => byId.get(id) ?? []);
        return found.length ? <Group key={group.id} id={group.id} results={found} /> : null;
      })}
    </div>
  );
}

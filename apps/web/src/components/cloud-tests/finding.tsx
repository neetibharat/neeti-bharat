'use client';

import {
  IconAlertTriangle,
  IconChevronDown,
  IconCircleCheck,
  IconCircleDashed,
  IconCircleX,
  type Icon,
} from '@tabler/icons-react';
import {
  CHECK_SEVERITY,
  CONNECTION_RESOURCES_KEPT,
  type ConnectionCheckResult,
  type ConnectionCheckStatus,
} from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import { outcomeKey } from '@/lib/connections';
import { AcceptButton, AcceptedNote, useAcceptances } from './acceptance';

type Words = (key: string, values?: Record<string, string | number>) => string;

const LOOK: Record<
  ConnectionCheckStatus,
  { icon: Icon; tone: string; badge: 'success' | 'warning' | 'danger' | 'gray' }
> = {
  pass: { icon: IconCircleCheck, tone: 'text-success', badge: 'success' },
  warn: { icon: IconAlertTriangle, tone: 'text-accent', badge: 'warning' },
  fail: { icon: IconCircleX, tone: 'text-danger', badge: 'danger' },
  skipped: { icon: IconCircleDashed, tone: 'text-fg-subtle', badge: 'gray' },
};

const SEVERITY_BADGE = { high: 'danger', medium: 'warning', low: 'gray' } as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-label font-semibold text-fg">{title}</h4>
      {children}
    </div>
  );
}

/** One resource that did not pass, with how it did not, and what a person decided about it. */
function ResourceRow({
  resource,
  result,
  connectionId,
}: {
  resource: NonNullable<ConnectionCheckResult['resources']>[number];
  result: ConnectionCheckResult;
  connectionId: string;
}) {
  const t = useTranslations('cloudTests.finding');
  const acceptance = useAcceptances(connectionId, result.id).get(resource.name);

  return (
    <li className="flex flex-col gap-1 px-3 py-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate font-mono text-label text-fg">{resource.name}</span>
        <div className="flex items-center gap-2">
          <Badge color={resource.status === 'fail' ? 'danger' : 'warning'}>
            {t(resource.status === 'fail' ? 'resourceFail' : 'resourceWarn')}
          </Badge>
          {!acceptance && (
            <AcceptButton
              connectionId={connectionId}
              checkId={result.id}
              resourceName={resource.name}
            />
          )}
        </div>
      </div>
      {acceptance && <AcceptedNote connectionId={connectionId} acceptance={acceptance} />}
    </li>
  );
}

function Resources({
  result,
  connectionId,
}: {
  result: ConnectionCheckResult;
  connectionId: string;
}) {
  const t = useTranslations('cloudTests.finding');
  const { resources } = result;
  if (!resources || resources.length === 0) return null;
  const count = Number(result.values?.count ?? resources.length);

  return (
    <Section title={t('resources', { count })}>
      <ul className="flex flex-col divide-y divide-line rounded-control border border-line">
        {resources.map((resource) => (
          <ResourceRow
            key={resource.name}
            resource={resource}
            result={result}
            connectionId={connectionId}
          />
        ))}
      </ul>
      {count > CONNECTION_RESOURCES_KEPT && (
        <p className="text-label text-fg-muted">{t('shown', { shown: resources.length, count })}</p>
      )}
    </Section>
  );
}

/** For a check that names no resources: accept it as a whole, or see that it was. */
function WholeCheck({
  result,
  connectionId,
}: {
  result: ConnectionCheckResult;
  connectionId: string;
}) {
  const t = useTranslations('cloudTests.accept');
  const whole = useAcceptances(connectionId, result.id).get('');
  const named = (result.resources?.length ?? 0) > 0;
  if (named || (result.status !== 'warn' && result.status !== 'fail')) return null;

  return (
    <div className="flex flex-col gap-1">
      {whole ? (
        <AcceptedNote connectionId={connectionId} acceptance={whole} />
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-label text-fg-muted">{t('wholeHint')}</p>
          <AcceptButton connectionId={connectionId} checkId={result.id} resourceName="" />
        </div>
      )}
    </div>
  );
}

/** What this account showed for the check, in words. */
function outcomeText(result: ConnectionCheckResult, check: Words): string {
  const key = outcomeKey(result);
  return key.startsWith('skipped.')
    ? check(key)
    : check(`checks.${result.id}.${key}`, result.values ?? {});
}

/** The detail under one finding: what the check is, why it matters, what this account showed, and how to fix it. */
function FindingDetail({
  result,
  connectionId,
}: {
  result: ConnectionCheckResult;
  connectionId: string;
}) {
  const t = useTranslations('cloudTests.finding');
  const check = useTranslations('connections') as unknown as Words;
  const detail = useTranslations('cloudTests.details') as unknown as Words;
  const needsFix = result.status === 'warn' || result.status === 'fail';

  return (
    <div className="flex flex-col gap-4 border-t border-line px-4 py-4 text-label text-fg-muted">
      <Section title={t('about')}>
        <p>{check(`checks.${result.id}.about`)}</p>
        <p>
          <span className="font-medium text-fg">{t('passRule')}</span>{' '}
          {detail(`${result.id}.passRule`)}
        </p>
        <p>
          <span className="font-medium text-fg">{t('failRule')}</span>{' '}
          {detail(`${result.id}.failRule`)}
        </p>
      </Section>
      <Section title={t('why')}>
        <p>{detail(`${result.id}.why`)}</p>
      </Section>
      <Section title={t('result')}>
        <p>{outcomeText(result, check)}</p>
      </Section>
      <Resources result={result} connectionId={connectionId} />
      <WholeCheck result={result} connectionId={connectionId} />
      {needsFix && (
        <Section title={t('fix')}>
          <p>{detail(`${result.id}.fix`)}</p>
        </Section>
      )}
    </div>
  );
}

/** One check as a row that opens to show the detail. A native disclosure keeps it light and reachable by keyboard. */
export function Finding({
  result,
  connectionId,
}: {
  result: ConnectionCheckResult;
  connectionId: string;
}) {
  const t = useTranslations('connections');
  const severity = useTranslations('cloudTests.severity');
  const check = t as unknown as Words;
  const { icon: StatusIcon, tone, badge } = LOOK[result.status];

  return (
    <details className="group rounded-control border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <StatusIcon className={`size-5 shrink-0 ${tone}`} aria-hidden />
        <span className="min-w-0 flex-1 text-body font-medium text-fg">
          {check(`checks.${result.id}.name`)}
        </span>
        <Badge color={SEVERITY_BADGE[CHECK_SEVERITY[result.id]]}>
          {severity(CHECK_SEVERITY[result.id])}
        </Badge>
        <Badge color={badge}>{t(`status.${result.status}`)}</Badge>
        <IconChevronDown
          className="size-4 shrink-0 text-fg-subtle transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <FindingDetail result={result} connectionId={connectionId} />
    </details>
  );
}

'use client';

import type { FrameworkResponse, RuleResponse } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Card } from '@/components/base/card/card';
import { Loading } from '@/components/base/loading/loading';
import { useGetChecklistQuery, useGetFrameworksQuery } from '@/lib/api/frameworks-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { ruleHeading } from '@/lib/rule-progress';
import { cx } from '@/lib/utils/cx';
import { DownloadButton } from './download-button';

/** The API path of one rule's pack. */
export const evidencePackPath = (frameworkId: string, ruleId: string) =>
  `/exports/evidence-pack/${encodeURIComponent(frameworkId)}/${encodeURIComponent(ruleId)}`;

function RuleRow({ rule }: { rule: RuleResponse }) {
  const t = useTranslations('exports.evidence');

  return (
    <li className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className={cx('min-w-0', !rule.applies && 'opacity-60')}>
        <p className="truncate text-body font-medium text-fg">{ruleHeading(rule)}</p>
        <p className="text-label text-fg-muted">
          {t('controls', { count: rule.controls.length })}
          {rule.applies ? '' : ` · ${t('notApplicable')}`}
        </p>
      </div>
      <DownloadButton
        path={evidencePackPath(rule.frameworkId, rule.id)}
        fallbackName={`evidence-pack-${rule.reference}.zip`}
        label={t('download')}
        color="secondary"
        size="sm"
      />
    </li>
  );
}

function FrameworkRules({ framework, titled }: { framework: FrameworkResponse; titled: boolean }) {
  const errorMessage = useErrorMessage();
  const { data, error } = useGetChecklistQuery(framework.id);
  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading className="h-24" />;

  return (
    <div className="flex flex-col gap-3">
      {titled && <p className="text-label font-semibold text-fg-subtle">{framework.name}</p>}
      <ul className="divide-y divide-line">
        {data.rules.map((rule) => (
          <RuleRow key={rule.id} rule={rule} />
        ))}
      </ul>
    </div>
  );
}

/** One download for each rule: its controls, the approved policies behind them, the proof and what was done about it. */
export function EvidencePacks() {
  const t = useTranslations('exports.evidence');
  const errorMessage = useErrorMessage();
  const { data, error } = useGetFrameworksQuery();

  return (
    <Card title={t('title')} description={t('description')}>
      {error && <Alert tone="error">{errorMessage(error)}</Alert>}
      {!data && !error && <Loading className="h-24" />}
      <div className="flex flex-col gap-6">
        {data?.frameworks.map((framework) => (
          <FrameworkRules
            key={framework.id}
            framework={framework}
            titled={data.frameworks.length > 1}
          />
        ))}
      </div>
    </Card>
  );
}

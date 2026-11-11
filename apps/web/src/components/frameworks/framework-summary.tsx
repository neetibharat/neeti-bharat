'use client';

import { ORGANISATION_RULE_ID, type FrameworkResponse, type RuleResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/base/card/card';
import { ProgressBar } from '@/components/base/progress-bar/progress-bar';
import { applyingControls, progressOf } from '@/lib/rule-progress';
import { FrameworkSeal } from './framework-seal';

/** The framework at a glance: what it is, how big it is, and how much is done. */
export function FrameworkSummary(props: { framework: FrameworkResponse; rules: RuleResponse[] }) {
  const t = useTranslations('frameworks.summary');
  const { framework, rules } = props;
  const controls = applyingControls(rules);
  const progress = progressOf(controls);
  const lawRules = rules.filter((rule) => rule.id !== ORGANISATION_RULE_ID);

  return (
    <Card padding="sm" className="flex flex-wrap items-center gap-5">
      <FrameworkSeal name={framework.seal} className="h-16 min-w-20" />
      <div className="min-w-60 flex-1">
        <h2 className="text-subtitle font-semibold text-fg">{framework.about}</h2>
        <p className="text-label text-fg-muted">
          {t('size', {
            applying: lawRules.filter((rule) => rule.applies).length,
            rules: lawRules.length,
            controls: controls.length,
          })}
        </p>
        <ProgressBar label={framework.name} value={progress.percent} className="mt-3" />
      </div>
      <div className="text-right">
        <p className="text-stat font-medium tracking-tight text-fg tabular-nums">
          {progress.percent}%
        </p>
        <p className="text-caption text-fg-muted">
          {t('done', { done: progress.done, total: progress.total })}
        </p>
      </div>
    </Card>
  );
}

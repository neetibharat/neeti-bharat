'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/base/card/card';
import type { Pillar, RuleStats } from '@/lib/rule-stats';
import { ReadinessBar } from './readiness-bar';

const PILLARS = ['controls', 'policies', 'proof'] as const;

/**
 * The three things a rule needs, side by side: its controls done, its policies approved, its proof in.
 * It shows at a glance which one is holding the rule back.
 */
export function RulePillars({ stats }: { stats: RuleStats }) {
  const t = useTranslations('frameworks.rulePage.pillars');

  return (
    <Card>
      <dl className="grid gap-6 sm:grid-cols-3 sm:divide-x sm:divide-line">
        {PILLARS.map((key) => (
          <PillarCell
            key={key}
            label={t(`${key}.label`)}
            hint={t(`${key}.hint`)}
            pillar={stats[key]}
          />
        ))}
      </dl>
    </Card>
  );
}

function PillarCell(props: { label: string; hint: string; pillar: Pillar }) {
  const t = useTranslations('frameworks.rulePage.pillars');
  const { pillar } = props;

  return (
    <div className="flex flex-col gap-2 sm:px-6 sm:first:pl-0 sm:last:pr-0">
      <dt className="text-label font-semibold text-fg-muted">{props.label}</dt>
      <dd className="flex flex-col gap-2">
        <span className="text-stat leading-none font-medium tracking-tight text-fg tabular-nums">
          {pillar.total === 0 ? t('none') : t('count', { done: pillar.done, total: pillar.total })}
        </span>
        <ReadinessBar percent={pillar.percent} label={props.label} />
        <span className="text-caption text-fg-muted">{props.hint}</span>
      </dd>
    </div>
  );
}

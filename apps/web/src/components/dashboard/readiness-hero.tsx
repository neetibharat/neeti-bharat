'use client';

import { useTranslations } from 'next-intl';
import { HeroFact, HeroFacts, HeroPanel } from '@/components/base/hero-panel/hero-panel';
import type { Overall, ProofFigures } from '@/lib/dashboard-stats';

export interface ReadinessHeroProps {
  overall: Overall;
  frameworkCount: number;
  policies: { approved: number; total: number };
  proof: ProofFigures;
}

/** How ready the company is, in one big gauge, with the three numbers behind it. */
export function ReadinessHero({ overall, frameworkCount, policies, proof }: ReadinessHeroProps) {
  const t = useTranslations('dashboard.hero');

  return (
    <HeroPanel
      tag={t('tag')}
      percent={overall.percent}
      gaugeLabel={t('summary', { done: overall.done, total: overall.total })}
      title={t('title')}
      text={t('text', { done: overall.done, total: overall.total, count: frameworkCount })}
    >
      <HeroFacts>
        <HeroFact label={t('policies')} value={`${policies.approved}/${policies.total}`} />
        <HeroFact label={t('proof')} value={`${proof.provided}/${proof.total}`} />
        <HeroFact label={t('overdue')} value={String(proof.overdue)} isAlert={proof.overdue > 0} />
      </HeroFacts>
    </HeroPanel>
  );
}

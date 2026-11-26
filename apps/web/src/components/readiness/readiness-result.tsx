'use client';

import { readinessBand, type ReadinessCheckResponse } from '@neeti-bharat/shared';
import { IconArrowRight } from '@tabler/icons-react';
import { useFormatter, useTranslations } from 'next-intl';
import { Card } from '@/components/base/card/card';
import { ProgressBar } from '@/components/base/progress-bar/progress-bar';
import { Link } from '@/i18n/navigation';
import { READINESS_LINKS, startHere } from '@/lib/readiness-links';

/** The score, what it means, how each area did, and where to start. */
export function ReadinessResult({ check }: { check: ReadinessCheckResponse }) {
  return (
    <div className="flex flex-col gap-4">
      <ScoreCard check={check} />
      <Card title={useTranslations('readiness.result')('byArea')}>
        <DomainBars check={check} />
      </Card>
      <StartHere check={check} />
    </div>
  );
}

function ScoreCard({ check }: { check: ReadinessCheckResponse }) {
  const t = useTranslations('readiness');
  const format = useFormatter();
  const band = readinessBand(check.score);

  return (
    <Card>
      <p className="text-label font-medium text-fg-muted">{t('result.title')}</p>
      <p className="mt-1 flex items-baseline gap-2">
        <span className="text-hero font-medium tracking-tight text-fg tabular-nums">
          {check.score}
        </span>
        <span className="text-subtitle text-fg-muted">{t('result.outOf')}</span>
      </p>
      <p className="mt-2 text-subtitle font-semibold text-brand">{t(`bands.${band}.name`)}</p>
      <p className="mt-1 max-w-prose text-body text-fg-muted">{t(`bands.${band}.text`)}</p>
      <p className="mt-3 text-caption text-fg-subtle">
        {t('result.taken', {
          when: format.dateTime(new Date(check.takenAt), {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
          name: check.takenByName,
        })}
      </p>
    </Card>
  );
}

function DomainBars({ check }: { check: ReadinessCheckResponse }) {
  const t = useTranslations('readiness');

  return (
    <ul className="flex flex-col gap-4">
      {check.domains.map((domain) => (
        <li key={domain.id}>
          <ProgressBar
            label={t(`domains.${domain.id}.title`)}
            value={domain.percent}
            valueText={t('result.earned', { earned: domain.earned, points: domain.points })}
            tone={domain.percent >= 70 ? 'success' : domain.percent >= 40 ? 'accent' : 'danger'}
          />
        </li>
      ))}
    </ul>
  );
}

function StartHere({ check }: { check: ReadinessCheckResponse }) {
  const t = useTranslations('readiness');
  const weak = startHere(check.domains);
  if (!weak.length) return null;

  return (
    <Card title={t('result.startTitle')} description={t('result.startAbout')}>
      <ul className="divide-y divide-line">
        {weak.map((domain) => (
          <li key={domain.id} className="py-3 first:pt-0 last:pb-0">
            <Link
              href={READINESS_LINKS[domain.id]}
              className="group flex items-center justify-between gap-4"
            >
              <span>
                <span className="block text-body font-medium text-fg">
                  {t(`domains.${domain.id}.title`)}
                </span>
                <span className="block text-label text-fg-muted">{t(`actions.${domain.id}`)}</span>
              </span>
              <IconArrowRight className="size-4 shrink-0 text-fg-subtle group-hover:text-brand" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

'use client';

import {
  RISK_LEVELS,
  riskReading,
  type RiskReading,
  type VendorResponse,
} from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/base/card/card';
import { TickRamp, type RampBand, type RampMark } from '@/components/graphs/tick-ramp';
import { cx } from '@/lib/utils/cx';
import { LEVEL_COLOR, levelRange } from '@/lib/vendor-risk';

type Rated = { key: 'inherent' | 'residual'; reading: RiskReading };

const ratedOf = (vendor: VendorResponse): Rated[] =>
  (['inherent', 'residual'] as const).flatMap((key) => {
    const rating = vendor[key];
    return rating ? [{ key, reading: riskReading(rating) }] : [];
  });

/** The five levels as stretches of the ramp. */
function useBands(): RampBand[] {
  const t = useTranslations('vendors.risk.levels');
  return RISK_LEVELS.map((level) => ({
    ...levelRange(level),
    label: t(level),
    color: LEVEL_COLOR[level],
  }));
}

/** A pill for each rating. The latest is the one to look at; the same score twice gets one pill. */
function useMarks(rated: Rated[]): RampMark[] {
  const t = useTranslations('vendors.risk.reduction');
  const last = rated[rated.length - 1];
  return rated
    .filter((r) => r === last || r.reading.score !== last?.reading.score)
    .map(({ key, reading }) => ({
      key,
      value: reading.score,
      label: t(key === last?.key ? 'now' : 'before', { score: reading.score }),
      strong: key === last?.key,
    }));
}

/** The headline: how much of the risk the measures took away, in the colour of the news. */
function Headline({ before, after }: { before: RiskReading; after: RiskReading }) {
  const t = useTranslations('vendors.risk.reduction');
  const drop = before.score - after.score;
  const percent = Math.round((Math.abs(drop) / before.score) * 100);
  const [key, sign, tone] =
    drop > 0
      ? (['lower', '−', 'text-success'] as const)
      : drop < 0
        ? (['higher', '+', 'text-danger'] as const)
        : (['same', '', 'text-fg-muted'] as const);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-stat font-semibold tracking-tight text-fg tabular-nums">
        {sign}
        {percent}%
      </span>
      <span className="text-body text-fg-muted">
        {t.rich(key, {
          count: Math.abs(drop),
          b: (chunks) => <b className={cx('font-semibold', tone)}>{chunks}</b>,
        })}
      </span>
    </div>
  );
}

/** The scores side by side, small, under the headline. */
function Scores({ rated }: { rated: Rated[] }) {
  const t = useTranslations('vendors.risk');
  return (
    <div className="flex gap-8">
      {rated.map(({ key, reading }) => (
        <div key={key} className="flex flex-col">
          <span className="text-title font-semibold text-fg tabular-nums">{reading.score}</span>
          <span className="text-caption text-fg-subtle">
            {t(`${key}.short`)} · {t(`levels.${reading.level}`)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** The left side: the headline when both are rated, else the one score and a nudge to rate the other. */
function Summary({ rated }: { rated: Rated[] }) {
  const t = useTranslations('vendors.risk.reduction');
  const [before, after] = rated;

  return (
    <div className="flex flex-col gap-6">
      {before && after ? (
        <Headline before={before.reading} after={after.reading} />
      ) : (
        <p className="text-body text-fg-muted">{t('one')}</p>
      )}
      <Scores rated={rated} />
    </div>
  );
}

/** What the company's measures did to the risk: the scale as a ramp, with what they took off hatched. */
export function ReductionCard({ vendor }: { vendor: VendorResponse }) {
  const t = useTranslations('vendors.risk.reduction');
  const rated = ratedOf(vendor);
  const bands = useBands();
  const marks = useMarks(rated);
  const [first, second] = rated.map((r) => r.reading.score);

  return (
    <Card title={t('title')} description={t('description')}>
      {first === undefined ? (
        <p className="text-body text-fg-subtle">{t('empty')}</p>
      ) : (
        <div className="grid items-end gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <Summary rated={rated} />
          <TickRamp max={25} bands={bands} filled={second ?? first} hatched={first} marks={marks} />
        </div>
      )}
    </Card>
  );
}

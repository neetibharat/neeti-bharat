'use client';

import type { RiskReading } from '@neeti-bharat/shared';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { DeltaChip } from '@/components/base/delta-chip/delta-chip';
import { LEVEL_COLOR } from '@/lib/vendor-risk';

interface Readings {
  before: RiskReading | null;
  after: RiskReading | null;
}

/** The score, counting up to its value unless the person has asked for less motion. */
function Score({ score }: { score: number }) {
  const reduced = useReducedMotion();
  const value = useMotionValue(reduced ? score : 0);
  const rounded = useTransform(value, (latest) => Math.round(latest));

  useEffect(() => {
    if (reduced) {
      value.set(score);
      return;
    }
    const controls = animate(value, score, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [score, reduced, value]);

  return (
    <motion.span className="text-stat leading-none font-medium tracking-tight text-fg tabular-nums">
      {rounded}
    </motion.span>
  );
}

/** The level as a pill, with a dot in its own colour. */
function LevelPill({ reading }: { reading: RiskReading }) {
  const t = useTranslations('vendors.risk.levels');
  const color = LEVEL_COLOR[reading.level];

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-label font-semibold text-fg"
      style={{ background: `color-mix(in srgb, ${color} 22%, var(--color-surface))` }}
    >
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      {t(reading.level)}
    </span>
  );
}

/** The risk now, large: the score and its level, or that nothing is rated yet. */
function Now({ reading }: { reading: RiskReading | null }) {
  const t = useTranslations('vendors.risk');

  return (
    <div className="flex flex-col gap-3">
      <p className="text-label font-medium text-fg-muted">{t('now')}</p>
      {reading ? (
        <>
          <p className="flex items-baseline gap-2">
            <Score score={reading.score} />
            <span className="text-body text-fg-subtle">{t('outOf', { max: 25 })}</span>
          </p>
          <LevelPill reading={reading} />
        </>
      ) : (
        <p className="text-body text-fg-subtle">{t('notRated')}</p>
      )}
    </div>
  );
}

/** One line of the comparison: a dot in the level's colour, the name, and the score with its level. */
function Line({ label, reading }: { label: string; reading: RiskReading | null }) {
  const t = useTranslations('vendors.risk');

  return (
    <li className="flex items-center justify-between gap-4 text-body">
      <span className="flex items-center gap-2 text-fg-muted">
        <span
          className="size-2.5 rounded-full"
          style={{ background: reading ? LEVEL_COLOR[reading.level] : 'var(--color-line-strong)' }}
        />
        {label}
      </span>
      <span className="font-medium text-fg tabular-nums">
        {reading ? `${reading.score} · ${t(`levels.${reading.level}`)}` : '–'}
      </span>
    </li>
  );
}

/** What the company's measures did: the drop in score as a chip, and in words. Nothing until both risks are rated. */
function Change({ before, after }: Readings) {
  const t = useTranslations('vendors.risk');
  if (!before || !after) return <p className="text-label text-fg-subtle">{t('compareHint')}</p>;
  const drop = before.score - after.score;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {drop !== 0 && (
        <DeltaChip
          direction={drop > 0 ? 'down' : 'up'}
          isGood={drop > 0}
          value={t('points', { count: Math.abs(drop) })}
        />
      )}
      <p className="text-label text-fg-muted">
        {t(drop > 0 ? 'reduced' : drop < 0 ? 'increased' : 'unchanged', {
          from: t(`levels.${before.level}`),
          to: t(`levels.${after.level}`),
        })}
      </p>
    </div>
  );
}

/** The figures beside the map: the risk now, the two ratings it comes from, and what changed between them. */
export function RiskFigures({ before, after }: Readings) {
  const t = useTranslations('vendors.risk');

  return (
    <div className="flex flex-col gap-6">
      <Now reading={after ?? before} />
      <ul className="flex flex-col gap-2.5 border-t border-line pt-4">
        <Line label={t('inherent.short')} reading={before} />
        <Line label={t('residual.short')} reading={after} />
      </ul>
      <Change before={before} after={after} />
    </div>
  );
}

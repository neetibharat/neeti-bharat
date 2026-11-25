'use client';

import { RISK_LEVELS, riskReading, type VendorRating, type VendorResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { ContourMap, type MapBand, type MapPoint } from '@/components/graphs/contour-map';
import { LEVEL_COLOR, levelRange } from '@/lib/vendor-risk';

/** Where each level starts on the map: halfway between its lowest score and the highest score below it. */
const BANDS: MapBand[] = RISK_LEVELS.map((level, index) => ({
  above: index === 0 ? 0 : levelRange(level).from - 0.5,
  color: LEVEL_COLOR[level],
}));

/** The five levels, each with its colour and the scores it covers, so the map can be read. */
function Legend() {
  const t = useTranslations('vendors.risk.levels');

  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-caption text-fg-muted">
      {RISK_LEVELS.map((level) => {
        const { from, to } = levelRange(level);
        return (
          <li key={level} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: LEVEL_COLOR[level] }} />
            {t(level)} {from === to ? from : `${from}–${to}`}
          </li>
        );
      })}
    </ul>
  );
}

/** A rating as a place on the map: impact across, likelihood up. Nothing while it is not rated. */
function pointOf(
  key: 'inherent' | 'residual',
  rating: VendorRating | null,
  label: string,
): MapPoint[] {
  if (!rating) return [];
  return [
    {
      key,
      x: rating.impact,
      y: rating.likelihood,
      color: LEVEL_COLOR[riskReading(rating).level],
      label,
      filled: key === 'residual',
    },
  ];
}

/** The vendor's risk on a map: where it started, where it is after the company's measures, and an arrow between. */
export function RiskMap({ vendor }: { vendor: VendorResponse }) {
  const t = useTranslations('vendors.risk');

  return (
    <div className="flex flex-col gap-3">
      <ContourMap
        steps={5}
        bands={BANDS}
        xLabel={t('map.impact')}
        yLabel={t('map.likelihood')}
        points={[
          ...pointOf('inherent', vendor.inherent, t('inherent.short')),
          ...pointOf('residual', vendor.residual, t('residual.short')),
        ]}
      />
      <Legend />
    </div>
  );
}

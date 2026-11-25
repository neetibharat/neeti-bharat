import {
  RISK_LEVELS,
  RISK_LEVEL_FROM,
  riskReading,
  type RiskLevel,
  type RiskReading,
  type VendorResponse,
} from '@dpdp-kit/shared';

/** The colour of each level on the dark panel, from calm to alarming. */
export const LEVEL_COLOR: Record<RiskLevel, string> = {
  very_low: 'var(--color-risk-very-low)',
  low: 'var(--color-risk-low)',
  medium: 'var(--color-risk-medium)',
  high: 'var(--color-risk-high)',
  very_high: 'var(--color-risk-very-high)',
};

/** The colour of a badge for each level. */
export const LEVEL_BADGE: Record<RiskLevel, 'success' | 'warning' | 'danger'> = {
  very_low: 'success',
  low: 'success',
  medium: 'warning',
  high: 'danger',
  very_high: 'danger',
};

/** The scores a level covers: from where it starts to just before the next one starts. */
export function levelRange(level: RiskLevel): { from: number; to: number } {
  const next = RISK_LEVELS[RISK_LEVELS.indexOf(level) + 1];
  return { from: RISK_LEVEL_FROM[level], to: next ? RISK_LEVEL_FROM[next] - 1 : 25 };
}

/** Where a score sits along a bar of five equal bands, from 0 to 1. */
export function barPosition(reading: RiskReading): number {
  const index = RISK_LEVELS.indexOf(reading.level);
  const { from, to } = levelRange(reading.level);
  const within = to === from ? 0.5 : (reading.score - from) / (to - from);
  return (index + 0.1 + within * 0.8) / RISK_LEVELS.length;
}

/** The risk to show for a vendor: after its measures once that is rated, else before, else none. */
export function currentRisk(vendor: VendorResponse): RiskReading | null {
  const rating = vendor.residual ?? vendor.inherent;
  return rating ? riskReading(rating) : null;
}

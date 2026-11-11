import type { PolicyStatus } from '@dpdp-kit/shared';

/** The fill for each status. They come from the theme, so the charts follow it. */
export const STATUS_COLORS: Record<PolicyStatus, string> = {
  approved: 'var(--color-chart-approved)',
  in_review: 'var(--color-chart-in-review)',
  draft: 'var(--color-chart-draft)',
};

/** One look for every chart tooltip. */
export const CHART_TOOLTIP = {
  cursor: { fill: 'var(--color-surface-muted)', opacity: 0.6 },
  contentStyle: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-line)',
    borderRadius: 8,
    boxShadow: 'var(--shadow-popover)',
    fontSize: 'var(--text-label)',
  },
  itemStyle: { color: 'var(--color-fg)' },
  labelStyle: { color: 'var(--color-fg-muted)', fontWeight: 600 },
} as const;

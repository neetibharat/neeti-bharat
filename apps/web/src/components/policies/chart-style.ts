import type { PolicyStatus } from '@neeti-bharat/shared';

/** The fill for each status. They come from the theme, so the charts follow it. */
export const STATUS_COLORS: Record<PolicyStatus, string> = {
  approved: 'var(--color-chart-approved)',
  in_review: 'var(--color-chart-in-review)',
  draft: 'var(--color-chart-draft)',
};

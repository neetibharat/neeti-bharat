import {
  READINESS_WEAK_BELOW,
  type ReadinessDomainId,
  type ReadinessDomainScore,
} from '@dpdp-kit/shared';

/** Where in the app each area of the readiness check is worked on. */
export const READINESS_LINKS: Record<ReadinessDomainId, string> = {
  governance: '/settings/people',
  consent_notice: '/policies',
  rights: '/requests',
  inventory: '/frameworks',
  security: '/proof',
  vendors: '/policies',
  breach_retention: '/breaches',
  children_special: '/frameworks',
};

/** How many areas "where to start" names. */
export const START_HERE_COUNT = 3;

/** The areas furthest from done, worst first, and only those below the line. */
export function startHere(domains: readonly ReadinessDomainScore[]): ReadinessDomainScore[] {
  return domains
    .filter((domain) => domain.percent < READINESS_WEAK_BELOW)
    .sort((a, b) => a.percent - b.percent || b.points - a.points)
    .slice(0, START_HERE_COUNT);
}

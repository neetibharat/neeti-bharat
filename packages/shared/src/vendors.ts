/** What a vendor does for the company. Keep in step with `VendorCategory` in the Prisma schema (a test checks). */
export const VENDOR_CATEGORIES = [
  'cloud',
  'payments',
  'communications',
  'hr',
  'support',
  'analytics',
  'other',
] as const;

export type VendorCategory = (typeof VENDOR_CATEGORIES)[number];

/** Where a vendor keeps the company's data. Keep in step with `VendorLocation` in the Prisma schema (a test checks). */
export const VENDOR_LOCATIONS = ['india', 'abroad', 'both'] as const;

export type VendorLocation = (typeof VENDOR_LOCATIONS)[number];

/** How far the company has got with looking at a vendor. Keep in step with `VendorStatus` in the Prisma schema (a test checks). */
export const VENDOR_STATUSES = ['not_assessed', 'in_progress', 'assessed'] as const;

export type VendorStatus = (typeof VENDOR_STATUSES)[number];

/** What the company has decided to do about a vendor's risk. Keep in step with `VendorTreatment` in the Prisma schema (a test checks). */
export const VENDOR_TREATMENTS = ['mitigate', 'transfer', 'accept', 'avoid'] as const;

export type VendorTreatment = (typeof VENDOR_TREATMENTS)[number];

/** The kinds of personal data a vendor can be given. A vendor stores the codes; the web app names them. */
export const VENDOR_DATA_KINDS = [
  'name',
  'contact',
  'government_id',
  'financial',
  'health',
  'location',
  'biometric',
  'credentials',
  'employment',
  'children',
  'other',
] as const;

export type VendorDataKind = (typeof VENDOR_DATA_KINDS)[number];

/** Active vendors, those that need a look, and those no longer used. */
export const VENDOR_TABS = ['active', 'attention', 'archived'] as const;

export type VendorTab = (typeof VENDOR_TABS)[number];

/** Why a vendor needs a look: details not filled in, not assessed yet, or its review date has passed. */
export type VendorAttention = 'details' | 'assessment' | 'review';

export const VENDOR_PAGE_SIZE = 25;
export const VENDOR_NAME_MAX_LENGTH = 120;
export const VENDOR_SERVICE_MAX_LENGTH = 500;
export const VENDOR_URL_MAX_LENGTH = 500;
export const VENDOR_TREATMENT_NOTE_MAX_LENGTH = 1000;

/** One step on a five-step scale, from 1 (least) to 5 (most). */
export const RISK_POINTS = [1, 2, 3, 4, 5] as const;

export type RiskPoint = (typeof RISK_POINTS)[number];

/** A risk read off the grid: how likely it is, and how bad it would be. */
export interface VendorRating {
  likelihood: RiskPoint;
  impact: RiskPoint;
}

export const RISK_LEVELS = ['very_low', 'low', 'medium', 'high', 'very_high'] as const;

export type RiskLevel = (typeof RISK_LEVELS)[number];

/** The score from which each level starts. The score is likelihood times impact, so 1 to 25. */
export const RISK_LEVEL_FROM: Record<RiskLevel, number> = {
  very_low: 1,
  low: 2,
  medium: 5,
  high: 10,
  very_high: 17,
};

export interface RiskReading {
  score: number;
  level: RiskLevel;
}

/** Likelihood times impact, and the level that score falls in. */
export function riskReading(rating: VendorRating): RiskReading {
  const score = rating.likelihood * rating.impact;
  const level = [...RISK_LEVELS].reverse().find((candidate) => score >= RISK_LEVEL_FROM[candidate]);
  return { score, level: level ?? 'very_low' };
}

/** Data whose loss hurts people most, so a vendor given any of it is rated worse. */
export const SENSITIVE_VENDOR_DATA: readonly VendorDataKind[] = [
  'health',
  'government_id',
  'financial',
  'biometric',
  'children',
];

/**
 * Where to start the grid for a vendor, from what is recorded about it: how bad a loss would be follows the data it is
 * given, and how likely one is follows where it keeps it. Null until both are said. It is only a starting point.
 */
export function suggestRating(
  dataKinds: readonly VendorDataKind[],
  location: VendorLocation | null,
): VendorRating | null {
  if (dataKinds.length === 0 || location === null) return null;
  const impact = dataKinds.some((kind) => SENSITIVE_VENDOR_DATA.includes(kind)) ? 4 : 3;
  const likelihood = location === 'india' ? 2 : location === 'both' ? 3 : 4;
  return { likelihood, impact };
}

/** One vendor, from `GET /v1/vendors`. Dates are YYYY-MM-DD days. */
export interface VendorResponse {
  id: string;
  name: string;
  website: string | null;
  /** What the vendor does for the company. */
  service: string;
  category: VendorCategory;
  status: VendorStatus;
  /** Empty until someone says what the vendor is given. */
  dataKinds: VendorDataKind[];
  /** Null until someone says where the vendor keeps the data. */
  location: VendorLocation | null;
  /** A link to the agreement, kept in the company's own storage. */
  agreementUrl: string | null;
  nextReviewOn: string | null;
  /** The person who answers for the vendor, or null when nobody is named or they have left. */
  owner: { id: string; name: string } | null;
  /** The risk before anything is done about it, or null until rated. */
  inherent: VendorRating | null;
  /** The risk after the company's own measures, or null until rated. */
  residual: VendorRating | null;
  /** Where the grid could start, from the data and place. Null until both are said. */
  suggested: VendorRating | null;
  /** What the company has decided to do about the risk, or null until decided. */
  treatment: VendorTreatment | null;
  /** Why that is the right decision, in the company's words. */
  treatmentNote: string | null;
  archivedAt: string | null;
  /** Empty for an archived vendor, which is no longer looked at. */
  attention: VendorAttention[];
}

/** Head counts that do not depend on the page or the search. */
export interface VendorCounts {
  active: number;
  attention: number;
  archived: number;
}

/** One page of vendors, from `GET /v1/vendors?tab=&q=&page=&limit=`. */
export interface VendorListResponse {
  vendors: VendorResponse[];
  /** How many vendors the chosen tab and the search match, across every page. */
  total: number;
  page: number;
  pageSize: number;
  counts: VendorCounts;
}

/** A vendor can be added with just who it is and what it does. The rest is filled in on its own page. */
export interface AddVendorRequest {
  name: string;
  website?: string;
  service: string;
  category: VendorCategory;
  status?: VendorStatus;
  dataKinds?: VendorDataKind[];
  location?: VendorLocation;
  agreementUrl?: string;
  nextReviewOn?: string;
  ownerId?: string;
  inherent?: VendorRating;
  residual?: VendorRating;
  treatment?: VendorTreatment;
  treatmentNote?: string;
}

/** Everything is optional. A field sent as null is emptied. */
export interface UpdateVendorRequest {
  name?: string;
  website?: string | null;
  service?: string;
  category?: VendorCategory;
  status?: VendorStatus;
  dataKinds?: VendorDataKind[];
  location?: VendorLocation | null;
  agreementUrl?: string | null;
  nextReviewOn?: string | null;
  ownerId?: string | null;
  inherent?: VendorRating | null;
  residual?: VendorRating | null;
  treatment?: VendorTreatment | null;
  treatmentNote?: string | null;
}

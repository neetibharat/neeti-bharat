import {
  suggestRating,
  type VendorAttention,
  type VendorDataKind,
  type VendorRating,
  type VendorResponse,
} from '@neeti-bharat/shared';
import { day, iso } from '../../frameworks/utils/dates';
import type { VendorRow } from '../repositories/vendor.repository';

type Dated = Pick<VendorRow, 'archivedAt' | 'dataKinds' | 'location' | 'status' | 'nextReviewOn'>;

/** A date counts as passed once the day it names is over. */
const passed = (date: Date | null, today: Date): boolean => date !== null && date < today;

/**
 * Each reason a vendor can need a look, and when it applies. Details count as missing until its data and where it
 * keeps it are said.
 */
const RULES: [VendorAttention, (row: Dated, today: Date) => boolean][] = [
  ['details', (row) => row.dataKinds.length === 0 || row.location === null],
  ['assessment', (row) => row.status !== 'assessed'],
  ['review', (row, today) => passed(row.nextReviewOn, today)],
];

/** Why a vendor needs a look. An archived vendor is no longer looked at. */
export function attentionOf(row: Dated, today: Date): VendorAttention[] {
  if (row.archivedAt) return [];
  return RULES.filter(([, applies]) => applies(row, today)).map(([reason]) => reason);
}

/** A place on the grid from its two stored ends, or null while either is missing. */
export function ratingOf(likelihood: number | null, impact: number | null): VendorRating | null {
  if (likelihood === null || impact === null) return null;
  // The columns hold 1 to 5: only the API writes them, and it checks.
  return { likelihood, impact } as VendorRating;
}

export function toVendorResponse(row: VendorRow, today: Date): VendorResponse {
  const dataKinds = row.dataKinds as VendorDataKind[];
  return {
    id: row.id,
    name: row.name,
    website: row.website,
    service: row.service,
    category: row.category,
    status: row.status,
    // The column holds text, and only the API writes it, from the list in packages/shared.
    dataKinds,
    location: row.location,
    agreementUrl: row.agreementUrl,
    nextReviewOn: day(row.nextReviewOn),
    owner: row.owner,
    inherent: ratingOf(row.inherentLikelihood, row.inherentImpact),
    residual: ratingOf(row.residualLikelihood, row.residualImpact),
    suggested: suggestRating(dataKinds, row.location),
    treatment: row.treatment,
    treatmentNote: row.treatmentNote,
    archivedAt: iso(row.archivedAt),
    attention: attentionOf(row, today),
  };
}

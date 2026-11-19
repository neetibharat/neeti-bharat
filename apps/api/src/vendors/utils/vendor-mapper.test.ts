import { describe, expect, it } from 'vitest';
import type { VendorRow } from '../repositories/vendor.repository';
import { attentionOf, ratingOf, toVendorResponse } from './vendor-mapper';

const today = new Date('2026-11-20T00:00:00.000Z');
const past = new Date('2026-11-19T00:00:00.000Z');
const future = new Date('2026-12-01T00:00:00.000Z');

const row = (over: Partial<VendorRow> = {}): VendorRow =>
  ({
    id: 'v1',
    name: 'Acme Payroll',
    website: null,
    service: 'Runs payroll',
    category: 'hr',
    status: 'assessed',
    dataKinds: ['name', 'financial'],
    location: 'india',
    agreementUrl: null,
    nextReviewOn: future,
    inherentLikelihood: null,
    inherentImpact: null,
    residualLikelihood: null,
    residualImpact: null,
    treatment: null,
    treatmentNote: null,
    ownerId: null,
    owner: null,
    archivedAt: null,
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    updatedAt: new Date('2026-04-01T00:00:00.000Z'),
    organizationId: 'o1',
    ...over,
  }) as VendorRow;

describe('attentionOf', () => {
  it('needs nothing from a vendor that is assessed, filled in, and not due a review', () => {
    expect(attentionOf(row(), today)).toEqual([]);
  });

  it('flags a vendor whose data or place is not said yet', () => {
    expect(attentionOf(row({ dataKinds: [] }), today)).toEqual(['details']);
    expect(attentionOf(row({ location: null }), today)).toEqual(['details']);
  });

  it('flags a vendor that is not assessed, whether not started or only begun', () => {
    expect(attentionOf(row({ status: 'not_assessed' }), today)).toEqual(['assessment']);
    expect(attentionOf(row({ status: 'in_progress' }), today)).toEqual(['assessment']);
  });

  it('flags a review date that has passed, but not one that is today', () => {
    expect(attentionOf(row({ nextReviewOn: past }), today)).toEqual(['review']);
    expect(attentionOf(row({ nextReviewOn: today }), today)).toEqual([]);
  });

  it('can flag several things at once, and nothing for an archived vendor', () => {
    const bad = row({ status: 'not_assessed', dataKinds: [] });
    expect(attentionOf(bad, today)).toEqual(['details', 'assessment']);
    expect(attentionOf({ ...bad, archivedAt: today }, today)).toEqual([]);
  });
});

describe('ratingOf', () => {
  it('is a place on the grid only when both ends are there', () => {
    expect(ratingOf(3, 4)).toEqual({ likelihood: 3, impact: 4 });
    expect(ratingOf(3, null)).toBeNull();
    expect(ratingOf(null, null)).toBeNull();
  });
});

describe('toVendorResponse', () => {
  it('sends days as YYYY-MM-DD, the ratings as places, and a suggestion from the data and place', () => {
    const vendor = toVendorResponse(
      row({ inherentLikelihood: 2, inherentImpact: 4, status: 'in_progress' }),
      today,
    );
    expect(vendor.nextReviewOn).toBe('2026-12-01');
    expect(vendor.inherent).toEqual({ likelihood: 2, impact: 4 });
    expect(vendor.residual).toBeNull();
    expect(vendor.suggested).toEqual({ likelihood: 2, impact: 4 });
    expect(vendor.attention).toEqual(['assessment']);
  });

  it('sends the decision about the risk and the reason for it, empty until decided', () => {
    expect(toVendorResponse(row(), today)).toMatchObject({ treatment: null, treatmentNote: null });
    const decided = toVendorResponse(
      row({ treatment: 'transfer', treatmentNote: 'Covered by the contract.' }),
      today,
    );
    expect(decided).toMatchObject({
      treatment: 'transfer',
      treatmentNote: 'Covered by the contract.',
    });
  });
});

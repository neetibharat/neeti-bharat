import type { VendorResponse } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import {
  NEW_VENDOR,
  canSaveVendor,
  toAddRequest,
  toTreatmentRequest,
  toTreatmentValues,
  toUpdateRequest,
  toValues,
  treatmentChanged,
} from './vendors';

const filled = { ...NEW_VENDOR, name: ' Acme Payroll ', service: 'Runs payroll' };

describe('canSaveVendor', () => {
  it('needs a name and what the vendor does, and nothing else', () => {
    expect(canSaveVendor('details', NEW_VENDOR)).toBe(false);
    expect(canSaveVendor('details', { ...filled, name: '  ' })).toBe(false);
    expect(canSaveVendor('details', { ...filled, service: '' })).toBe(false);
    expect(canSaveVendor('details', filled)).toBe(true);
    expect(canSaveVendor('data', NEW_VENDOR)).toBe(true);
  });
});

describe('toAddRequest', () => {
  it('sends only who the vendor is, trimmed, leaving out what was not filled in', () => {
    expect(toAddRequest(filled)).toEqual({
      name: 'Acme Payroll',
      website: undefined,
      service: 'Runs payroll',
      category: 'other',
      ownerId: undefined,
    });
  });
});

describe('toUpdateRequest', () => {
  it('sends only the part that was edited', () => {
    expect(toUpdateRequest('data', { ...filled, dataKinds: ['name'], location: 'abroad' })).toEqual(
      { dataKinds: ['name'], location: 'abroad' },
    );
    expect(Object.keys(toUpdateRequest('review', filled)).sort()).toEqual([
      'agreementUrl',
      'nextReviewOn',
    ]);
    expect(toUpdateRequest('details', { ...filled, status: 'assessed' }).status).toBe('assessed');
  });

  it('sends what was emptied as null, so the API clears it', () => {
    const details = toUpdateRequest('details', filled);
    expect(details.website).toBeNull();
    expect(details.ownerId).toBeNull();
    expect(toUpdateRequest('review', filled)).toEqual({ agreementUrl: null, nextReviewOn: null });
    expect(toUpdateRequest('data', filled).location).toBeNull();
  });
});

describe('toValues', () => {
  it('turns a vendor back into form values, with empty text for what it lacks', () => {
    const vendor = {
      id: 'v1',
      name: 'Acme Payroll',
      website: null,
      service: 'Runs payroll',
      category: 'hr',
      status: 'assessed',
      dataKinds: [],
      location: null,
      agreementUrl: null,
      nextReviewOn: '2026-12-01',
      owner: { id: 'p1', name: 'Ravi' },
      inherent: null,
      residual: null,
      suggested: null,
      archivedAt: null,
      attention: [],
    } as unknown as VendorResponse;
    const values = toValues(vendor);
    expect(values.website).toBe('');
    expect(values.location).toBeNull();
    expect(values.nextReviewOn).toBe('2026-12-01');
    expect(values.ownerId).toBe('p1');
    expect(values.status).toBe('assessed');
  });
});

describe('treatment', () => {
  const vendor = {
    treatment: 'transfer',
    treatmentNote: 'Covered by the contract.',
  } as VendorResponse;

  it('starts from what is saved, with empty text for a reason that was never written', () => {
    expect(toTreatmentValues(vendor)).toEqual({
      treatment: 'transfer',
      note: 'Covered by the contract.',
    });
    expect(toTreatmentValues({ treatment: null, treatmentNote: null } as VendorResponse)).toEqual({
      treatment: null,
      note: '',
    });
  });

  it('notices a change in either part, but not in spaces around the reason', () => {
    const same = toTreatmentValues(vendor);
    expect(treatmentChanged(vendor, same)).toBe(false);
    expect(treatmentChanged(vendor, { ...same, note: '  Covered by the contract.  ' })).toBe(false);
    expect(treatmentChanged(vendor, { ...same, treatment: 'accept' })).toBe(true);
    expect(treatmentChanged(vendor, { ...same, note: 'Changed.' })).toBe(true);
  });

  it('sends an empty reason as null so the API clears it', () => {
    expect(toTreatmentRequest({ treatment: 'accept', note: '   ' })).toEqual({
      treatment: 'accept',
      treatmentNote: null,
    });
    expect(toTreatmentRequest({ treatment: null, note: ' Why. ' })).toEqual({
      treatment: null,
      treatmentNote: 'Why.',
    });
  });
});

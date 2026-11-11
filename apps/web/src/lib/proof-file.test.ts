import { describe, expect, it } from 'vitest';
import { checkProofFile, listAllowedTypes, pickerTypes } from './proof-file';

const rules = { maxBytes: 1000, allowedTypes: ['pdf', 'png', 'txt'] };

describe('checkProofFile', () => {
  it('accepts an allowed type within the limit, whatever the case', () => {
    expect(checkProofFile({ name: 'scan.pdf', size: 500 }, rules)).toBeNull();
    expect(checkProofFile({ name: 'SCAN.PDF', size: 1000 }, rules)).toBeNull();
  });

  it('turns back a file over the limit', () => {
    expect(checkProofFile({ name: 'scan.pdf', size: 1001 }, rules)).toBe('tooLarge');
  });

  it('turns back a type that is not allowed, or a name with no extension', () => {
    expect(checkProofFile({ name: 'setup.exe', size: 10 }, rules)).toBe('type');
    expect(checkProofFile({ name: 'README', size: 10 }, rules)).toBe('type');
    expect(checkProofFile({ name: '.pdf', size: 10 }, rules)).toBe('type');
  });

  it('turns back an empty file', () => {
    expect(checkProofFile({ name: 'scan.pdf', size: 0 }, rules)).toBe('empty');
  });
});

describe('type lists', () => {
  it('reads as capitals for people and with dots for the file picker', () => {
    expect(listAllowedTypes(['pdf', 'png'])).toBe('PDF, PNG');
    expect(pickerTypes(['pdf', 'png'])).toEqual(['.pdf', '.png']);
  });
});

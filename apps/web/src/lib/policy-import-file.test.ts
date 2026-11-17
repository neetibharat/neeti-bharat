import { POLICY_IMPORT_MAX_BYTES } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import { checkImportFile, IMPORT_PICKER_TYPES } from './policy-import-file';

describe('checkImportFile', () => {
  it('accepts PDF, Word and PowerPoint files, whatever the case', () => {
    for (const name of ['p.pdf', 'p.DOCX', 'My policy v2.pptx']) {
      expect(checkImportFile({ name, size: 1000 })).toBeNull();
    }
  });

  it('refuses other types, including old Word and PowerPoint files', () => {
    for (const name of ['p.doc', 'p.ppt', 'p.txt', 'p.xlsx', 'p', 'pdf']) {
      expect(checkImportFile({ name, size: 1000 })).toBe('type');
    }
  });

  it('refuses an empty file and one over the limit', () => {
    expect(checkImportFile({ name: 'p.pdf', size: 0 })).toBe('empty');
    expect(checkImportFile({ name: 'p.pdf', size: POLICY_IMPORT_MAX_BYTES })).toBeNull();
    expect(checkImportFile({ name: 'p.pdf', size: POLICY_IMPORT_MAX_BYTES + 1 })).toBe('size');
  });

  it('offers the same types to the file picker', () => {
    expect(IMPORT_PICKER_TYPES).toEqual(['.pdf', '.docx', '.pptx']);
  });
});

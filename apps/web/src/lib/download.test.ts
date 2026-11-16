import { describe, expect, it } from 'vitest';
import { fileNameFromDisposition } from './download';

describe('fileNameFromDisposition', () => {
  it('reads an encoded name', () => {
    const header = "attachment; filename*=UTF-8''audit-pack-2026-11-11.zip";
    expect(fileNameFromDisposition(header, 'x')).toBe('audit-pack-2026-11-11.zip');
  });

  it('decodes spaces and other characters', () => {
    expect(fileNameFromDisposition("attachment; filename*=UTF-8''my%20file.csv", 'x')).toBe(
      'my file.csv',
    );
  });

  it('uses the fallback when there is no name or it cannot be read', () => {
    expect(fileNameFromDisposition(null, 'fallback.csv')).toBe('fallback.csv');
    expect(fileNameFromDisposition("attachment; filename*=UTF-8''%E0%A4%A", 'fb')).toBe('fb');
  });
});

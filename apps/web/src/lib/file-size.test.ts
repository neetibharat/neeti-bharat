import { describe, expect, it } from 'vitest';
import { formatFileSize } from './file-size';

describe('formatFileSize', () => {
  it('shows small sizes in bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(191)).toBe('191 B');
    expect(formatFileSize(1023)).toBe('1023 B');
  });

  it('moves up a unit at 1024 and keeps one decimal at most', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1024 * 1024 * 2.25)).toBe('2.3 MB');
  });

  it('shows the upload limit as 25 MB', () => {
    expect(formatFileSize(25 * 1024 * 1024)).toBe('25 MB');
  });

  it('does not go past GB, and treats a negative size as zero', () => {
    expect(formatFileSize(5 * 1024 ** 4)).toBe('5120 GB');
    expect(formatFileSize(-5)).toBe('0 B');
  });
});

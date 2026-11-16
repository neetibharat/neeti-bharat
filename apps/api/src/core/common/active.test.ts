import { describe, expect, it } from 'vitest';
import { activeOrNotFound, archivedOrNotFound } from './active';

const live = { id: 'a', archivedAt: null };
const gone = { id: 'b', archivedAt: new Date() };

describe('activeOrNotFound', () => {
  it('returns a row that is in use', () => {
    expect(activeOrNotFound(live)).toBe(live);
  });

  it.each([null, undefined, gone])('refuses %o as not found', (row) => {
    expect(() => activeOrNotFound(row)).toThrowError(
      expect.objectContaining({ code: 'NOT_FOUND' }),
    );
  });
});

describe('archivedOrNotFound', () => {
  it('returns an archived row', () => {
    expect(archivedOrNotFound(gone)).toBe(gone);
  });

  it.each([null, undefined, live])('refuses %o as not found', (row) => {
    expect(() => archivedOrNotFound(row)).toThrowError(
      expect.objectContaining({ code: 'NOT_FOUND' }),
    );
  });
});

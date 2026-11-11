import { describe, expect, it } from 'vitest';
import { trimStrings } from './form';

describe('trimStrings', () => {
  it('trims text fields and leaves other fields alone', () => {
    const values = { title: '  Hello ', count: 3, ids: [' a '], due: null };
    expect(trimStrings(values)).toEqual({ title: 'Hello', count: 3, ids: [' a '], due: null });
  });

  it('does not change the original', () => {
    const values = { title: ' x ' };
    trimStrings(values);
    expect(values.title).toBe(' x ');
  });

  it('turns blank text into an empty string', () => {
    expect(trimStrings({ name: '   ' }).name).toBe('');
  });
});

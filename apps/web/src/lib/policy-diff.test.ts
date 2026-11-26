import type { PolicyDocument } from '@neeti-bharat/shared';
import { describe, expect, it } from 'vitest';
import {
  changedLines,
  collapseSame,
  diffRows,
  plainLine,
  policyLines,
  wordSegments,
} from './policy-diff';

const doc: PolicyDocument = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '1. Purpose' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'We protect data.' }] },
  ],
};

describe('policyLines', () => {
  it('gives one line for each heading and paragraph, keeping the company answers as keys', () => {
    const withKey: PolicyDocument = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Run by {{companyName}}.' }] },
      ],
    };
    expect(policyLines(doc)).toEqual(['## 1. Purpose', 'We protect data.']);
    expect(policyLines(withKey)).toEqual(['Run by {{companyName}}.']);
  });
});

describe('plainLine', () => {
  it('takes the bold and italic signs off, and leaves headings, bullets and other asterisks alone', () => {
    expect(plainLine('- **DPDP-R6-01 Encryption**: Frequency: yearly')).toBe(
      '- DPDP-R6-01 Encryption: Frequency: yearly',
    );
    expect(plainLine('Keep *this* safe')).toBe('Keep this safe');
    expect(plainLine('## 3. Rule 6')).toBe('## 3. Rule 6');
    expect(plainLine('2 * 3 * 4')).toBe('2 * 3 * 4');
  });
});

describe('diffRows', () => {
  it('has no change for the same text', () => {
    expect(changedLines(diffRows(['a', 'b'], ['a', 'b']))).toBe(0);
  });

  it('pairs a line that was reworded as one change, and notes lines added or removed', () => {
    const rows = diffRows(['one', 'two', 'three'], ['one', 'TWO', 'three', 'four']);
    expect(rows).toEqual([
      { kind: 'same', text: 'one' },
      { kind: 'changed', before: 'two', after: 'TWO' },
      { kind: 'same', text: 'three' },
      { kind: 'added', text: 'four' },
    ]);
    expect(diffRows(['a', 'b'], ['a'])).toEqual([
      { kind: 'same', text: 'a' },
      { kind: 'removed', text: 'b' },
    ]);
  });

  it('copes with an empty side', () => {
    expect(diffRows([], ['a'])).toEqual([{ kind: 'added', text: 'a' }]);
    expect(diffRows(['a'], [])).toEqual([{ kind: 'removed', text: 'a' }]);
  });
});

describe('wordSegments', () => {
  it('marks only the words that changed', () => {
    const { before, after } = wordSegments(
      'The organisation protects data.',
      'Acme Pvt Ltd protects data.',
    );
    expect(before.filter((s) => s.changed).map((s) => s.text.trim())).toEqual(['The organisation']);
    expect(after.filter((s) => s.changed).map((s) => s.text.trim())).toEqual(['Acme Pvt Ltd']);
    expect(before.map((s) => s.text).join('')).toBe('The organisation protects data.');
    expect(after.map((s) => s.text).join('')).toBe('Acme Pvt Ltd protects data.');
  });
});

describe('collapseSame', () => {
  it('folds long runs of unchanged lines and keeps a line of context around a change', () => {
    const lines = (prefix: string) => Array.from({ length: 10 }, (_, i) => `${prefix} ${i}`);
    const rows = diffRows(
      [...lines('first'), 'old', ...lines('last')],
      [...lines('first'), 'new', ...lines('last')],
    );
    const shown = collapseSame(rows);
    expect(shown.filter((row) => row.kind === 'skipped')).toEqual([
      { kind: 'skipped', count: 9 },
      { kind: 'skipped', count: 9 },
    ]);
    expect(shown.some((row) => row.kind === 'changed')).toBe(true);
  });

  it('shows everything when nothing is long enough to fold', () => {
    const rows = diffRows(['a', 'b'], ['a', 'c']);
    expect(collapseSame(rows).every((row) => row.kind !== 'skipped')).toBe(true);
  });
});

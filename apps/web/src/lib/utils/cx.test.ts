import { describe, expect, it } from 'vitest';
import { cx } from './cx';

describe('cx', () => {
  it('keeps a type-scale size next to a colour', () => {
    expect(cx('text-label font-medium', 'text-fg-muted')).toBe(
      'text-label font-medium text-fg-muted',
    );
  });

  it('lets a later size replace an earlier one', () => {
    expect(cx('text-body', 'text-title')).toBe('text-title');
  });

  it('treats our radius and shadow tokens as such', () => {
    expect(cx('rounded-control shadow-popover', 'rounded-card')).toBe(
      'shadow-popover rounded-card',
    );
  });

  it('still resolves ordinary conflicts', () => {
    expect(cx('px-3 py-2', 'px-4')).toBe('py-2 px-4');
  });
});

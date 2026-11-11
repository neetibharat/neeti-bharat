import { describe, expect, it } from 'vitest';
import {
  REQUEST_BOARD_LIMIT,
  REQUEST_BOARD_MAX_LIMIT,
  REQUEST_FORM_SOURCES,
  REQUEST_SOURCES,
  isReadyToClose,
  requestRef,
} from './requests.js';

describe('isReadyToClose', () => {
  it('needs the identity checked', () => {
    expect(isReadyToClose({ identityVerified: false, tasks: [] })).toBe(false);
  });

  it('is ready with no tasks once the identity is checked', () => {
    expect(isReadyToClose({ identityVerified: true, tasks: [] })).toBe(true);
  });

  it('waits for every task to leave the to do state', () => {
    const tasks = [{ outcome: 'done' as const }, { outcome: 'todo' as const }];
    expect(isReadyToClose({ identityVerified: true, tasks })).toBe(false);
    expect(
      isReadyToClose({
        identityVerified: true,
        tasks: [{ outcome: 'kept_by_law' }, ...tasks.slice(0, 1)],
      }),
    ).toBe(true);
  });
});

describe('REQUEST_FORM_SOURCES', () => {
  it('offers only sources a person can log by hand', () => {
    expect(REQUEST_FORM_SOURCES.every((source) => REQUEST_SOURCES.includes(source))).toBe(true);
    expect(REQUEST_FORM_SOURCES).not.toContain('website');
  });
});

describe('requestRef', () => {
  it('writes the number after REQ- with no padding', () => {
    expect(requestRef(1)).toBe('REQ-1');
    expect(requestRef(12)).toBe('REQ-12');
    expect(requestRef(1042)).toBe('REQ-1042');
  });
});

describe('board limits', () => {
  it('starts within the most a column can be asked for', () => {
    expect(REQUEST_BOARD_LIMIT).toBeLessThanOrEqual(REQUEST_BOARD_MAX_LIMIT);
  });
});

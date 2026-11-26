import type { RequestTaskResponse } from '@neeti-bharat/shared';
import { describe, expect, it } from 'vitest';
import { closeBlocker, isTaskChanged, taskDraftOf, tasksToDo, toTaskUpdate } from './request-tasks';

const task = (over: Partial<RequestTaskResponse> = {}): RequestTaskResponse => ({
  id: 't1',
  system: 'Billing',
  outcome: 'todo',
  reason: null,
  ...over,
});

describe('closeBlocker', () => {
  const verified = '2026-11-10T00:00:00Z';

  it('names the identity check before anything else', () => {
    expect(closeBlocker({ identityVerifiedAt: null, tasks: [task()] })).toBe('identity');
  });

  it('names tasks still to do once the identity is checked', () => {
    expect(closeBlocker({ identityVerifiedAt: verified, tasks: [task()] })).toBe('tasks');
  });

  it('is clear with no tasks, or none to do', () => {
    expect(closeBlocker({ identityVerifiedAt: verified, tasks: [] })).toBeNull();
    const done = [task({ outcome: 'done' }), task({ outcome: 'kept_by_law', reason: 'Tax' })];
    expect(closeBlocker({ identityVerifiedAt: verified, tasks: done })).toBeNull();
  });
});

describe('tasksToDo', () => {
  it('counts only tasks still to do', () => {
    expect(tasksToDo([task(), task({ outcome: 'erased' }), task()])).toBe(2);
  });
});

describe('toTaskUpdate', () => {
  it('sends the outcome alone unless the data is kept by law', () => {
    expect(toTaskUpdate({ outcome: 'erased', reason: 'left over' })).toEqual({ outcome: 'erased' });
  });

  it('needs a reason, trimmed, to keep data by law', () => {
    expect(toTaskUpdate({ outcome: 'kept_by_law', reason: '  ' })).toBeNull();
    expect(toTaskUpdate({ outcome: 'kept_by_law', reason: ' Tax law ' })).toEqual({
      outcome: 'kept_by_law',
      reason: 'Tax law',
    });
  });
});

describe('isTaskChanged', () => {
  it('is true for a new outcome and false for the saved one', () => {
    const saved = task({ outcome: 'kept_by_law', reason: 'Tax law' });
    expect(isTaskChanged(saved, taskDraftOf(saved))).toBe(false);
    expect(isTaskChanged(saved, { outcome: 'done', reason: 'Tax law' })).toBe(true);
  });

  it('notices a changed reason only while kept by law', () => {
    const saved = task({ outcome: 'kept_by_law', reason: 'Tax law' });
    expect(isTaskChanged(saved, { outcome: 'kept_by_law', reason: 'Audit' })).toBe(true);
    expect(isTaskChanged(task(), { outcome: 'todo', reason: 'typed then dropped' })).toBe(false);
  });
});

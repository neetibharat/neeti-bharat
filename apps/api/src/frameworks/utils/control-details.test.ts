import { describe, expect, it } from 'vitest';
import type { ControlDetailsInput } from '../dto/control.dto';
import type { ControlWithLinks } from '../repositories/control.repository';
import { diffDetails } from './control-details';

const control = {
  title: 'Board intimation',
  description: 'The Board is told.',
  reviewDate: new Date('2027-03-31T00:00:00.000Z'),
  assigneeId: 'p1',
  assignee: { id: 'p1', name: 'Priya' },
  policies: [
    { policyId: 'P08', position: 0 },
    { policyId: 'P01', position: 1 },
  ],
} as unknown as ControlWithLinks;

const same: ControlDetailsInput = {
  title: 'Board intimation',
  description: 'The Board is told.',
  assigneeId: 'p1',
  reviewDate: '2027-03-31',
  policyIds: ['P08', 'P01'],
};

describe('diffDetails', () => {
  it('finds nothing to change when the same details are saved again', () => {
    expect(diffDetails(control, same)).toEqual({ edited: false, assignee: null });
  });

  it.each([
    ['title', { title: 'Tell the Board' }],
    ['description', { description: 'Changed.' }],
    ['review date', { reviewDate: null }],
    ['policies', { policyIds: ['P08'] }],
    ['order of policies', { policyIds: ['P01', 'P08'] }],
  ])('sees a change to the %s', (_name, change) => {
    expect(diffDetails(control, { ...same, ...change }).edited).toBe(true);
  });

  it('sees a change of person separately from an edit', () => {
    expect(diffDetails(control, { ...same, assigneeId: 'p2' })).toEqual({
      edited: false,
      assignee: { from: 'Priya', toId: 'p2' },
    });
    expect(diffDetails(control, { ...same, assigneeId: null }).assignee).toEqual({
      from: 'Priya',
      toId: null,
    });
  });
});

import { describe, expect, it } from 'vitest';
import { NO_FILTERS, toProofQuery } from './proof-query';

describe('toProofQuery', () => {
  it('sends only what is set', () => {
    expect(toProofQuery({ filters: NO_FILTERS, tab: 'all', page: 1 })).toEqual({
      tab: 'all',
      q: undefined,
      assigneeId: undefined,
      ruleId: undefined,
      controlId: undefined,
      page: 1,
      limit: 25,
    });
  });

  it('trims the search and passes the person, rule and control on', () => {
    const query = toProofQuery({
      filters: { search: '  letter ', assigneeId: 'p1', ruleId: 'R6' },
      tab: 'overdue',
      page: 2,
      controlId: 'c1',
    });
    expect(query).toMatchObject({
      tab: 'overdue',
      q: 'letter',
      assigneeId: 'p1',
      ruleId: 'R6',
      controlId: 'c1',
      page: 2,
    });
  });
});

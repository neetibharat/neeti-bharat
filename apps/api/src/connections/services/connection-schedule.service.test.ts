import { describe, expect, it } from 'vitest';
import { nextDue } from './connection-schedule.service';

const at = (iso: string) => new Date(iso);

describe('nextDue', () => {
  it('is never for a connection that is off', () => {
    expect(nextDue('off', at('2026-01-01T00:00:00Z'), null)).toBeNull();
  });

  it('counts a day, less the hour an hourly look needs, from the last check', () => {
    expect(nextDue('daily', at('2026-01-01T10:00:00Z'), null)).toEqual(at('2026-01-02T09:00:00Z'));
  });

  it('counts a week less an hour for a weekly schedule', () => {
    expect(nextDue('weekly', at('2026-01-01T10:00:00Z'), null)).toEqual(at('2026-01-08T09:00:00Z'));
  });

  it('counts from a try that could not sign in when that is later than the last check', () => {
    expect(nextDue('daily', at('2026-01-01T10:00:00Z'), at('2026-01-03T10:00:00Z'))).toEqual(
      at('2026-01-04T09:00:00Z'),
    );
  });

  it('is due at once for a connection that was never checked', () => {
    expect(nextDue('daily', null, null)!.getTime()).toBeLessThan(
      at('1971-01-01T00:00:00Z').getTime(),
    );
  });
});

import type { BreachResponse } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import {
  breachRequestOf,
  breachValuesOf,
  fromFormMoment,
  newBreachValues,
  toBreachRequest,
  toFormMoment,
  toPeopleAffected,
} from './breach-form';

describe('form moments', () => {
  it('round-trips through the local date and time', () => {
    const moment = new Date(2026, 10, 9, 7, 5);
    const { date, time } = toFormMoment(moment);
    expect(date).toBe('2026-11-09');
    expect(time).toBe('07:05');
    expect(fromFormMoment(date, time)).toBe(moment.toISOString());
  });

  it('is null when the date or time is missing or wrong', () => {
    expect(fromFormMoment(null, '10:00')).toBeNull();
    expect(fromFormMoment('2026-11-09', '')).toBeNull();
    expect(fromFormMoment('2026-11-09', '25:99')).toBeNull();
  });
});

describe('toPeopleAffected', () => {
  it('reads a whole number and treats anything else as not known', () => {
    expect(toPeopleAffected(' 120 ')).toBe(120);
    expect(toPeopleAffected('0')).toBe(0);
    expect(toPeopleAffected('')).toBeNull();
    expect(toPeopleAffected('about 50')).toBeNull();
    expect(toPeopleAffected('-3')).toBeNull();
  });
});

describe('breach values', () => {
  const filled = {
    ...newBreachValues(new Date(2026, 10, 9, 7, 5)),
    title: ' Wrong address ',
    description: 'A file went out.',
    affectedSystems: 'Billing',
    affectedData: 'Emails',
    peopleAffected: '40',
    assigneeId: 'p1' as string | null,
  };

  it('starts a new breach at the time given', () => {
    expect(newBreachValues(new Date(2026, 10, 9, 7, 5))).toMatchObject({
      foundDate: '2026-11-09',
      foundTime: '07:05',
      title: '',
    });
  });

  it('builds the request from what was typed, trimmed', () => {
    expect(toBreachRequest(filled)).toEqual({
      title: 'Wrong address',
      description: 'A file went out.',
      foundAt: new Date(2026, 10, 9, 7, 5).toISOString(),
      affectedSystems: 'Billing',
      affectedData: 'Emails',
      peopleAffected: 40,
      assigneeId: 'p1',
    });
  });

  it('sends no assignee for the DPO', () => {
    expect(toBreachRequest({ ...filled, assigneeId: null })).toMatchObject({ assigneeId: null });
  });

  it('is not ready while a required field is empty or the date is missing', () => {
    expect(toBreachRequest({ ...filled, affectedData: '  ' })).toBeNull();
    expect(toBreachRequest({ ...filled, foundDate: null })).toBeNull();
  });

  it('fills the form from a breach', () => {
    const breach = {
      title: 'T',
      description: 'D',
      foundAt: new Date(2026, 10, 9, 7, 5).toISOString(),
      affectedSystems: 'S',
      affectedData: 'X',
      peopleAffected: null,
      assignee: { id: 'p2', name: 'Meera' },
    } as BreachResponse;
    expect(breachValuesOf(breach)).toMatchObject({
      foundDate: '2026-11-09',
      foundTime: '07:05',
      peopleAffected: '',
      assigneeId: 'p2',
    });
  });

  it('keeps a breach as it stands, with its assignee, for changing one thing', () => {
    const breach = {
      title: 'T',
      description: 'D',
      foundAt: '2026-11-09T07:05:00.000Z',
      affectedSystems: 'S',
      affectedData: 'X',
      peopleAffected: 3,
      assignee: null,
    } as BreachResponse;
    expect(breachRequestOf(breach)).toEqual({
      title: 'T',
      description: 'D',
      foundAt: '2026-11-09T07:05:00.000Z',
      affectedSystems: 'S',
      affectedData: 'X',
      peopleAffected: 3,
      assigneeId: null,
    });
  });
});

import type { RequestResponse } from '@neeti-bharat/shared';
import { describe, expect, it } from 'vitest';
import {
  newRequestValues,
  requestUpdateOf,
  requestValuesOf,
  toCreateRequest,
  toUpdateRequest,
  type RequestValues,
} from './request-form';

const filled = (over: Partial<RequestValues> = {}): RequestValues => ({
  ...newRequestValues(new Date(2026, 10, 10, 9, 30)),
  personName: ' Asha Rao ',
  personEmail: ' asha@example.com ',
  details: ' Please erase my account. ',
  ...over,
});

describe('newRequestValues', () => {
  it('starts as a copy of data, logged by hand, received now', () => {
    expect(newRequestValues(new Date(2026, 10, 10, 9, 30))).toMatchObject({
      type: 'access',
      source: 'manual',
      receivedDate: '2026-11-10',
      receivedTime: '09:30',
    });
  });
});

describe('toUpdateRequest', () => {
  it('trims what was typed', () => {
    expect(toUpdateRequest(filled({ type: 'erasure' }))).toEqual({
      type: 'erasure',
      personName: 'Asha Rao',
      personEmail: 'asha@example.com',
      details: 'Please erase my account.',
      assigneeId: null,
    });
  });

  it('carries who deals with it', () => {
    expect(toUpdateRequest(filled({ assigneeId: 'p1' }))).toMatchObject({ assigneeId: 'p1' });
    expect(toCreateRequest(filled({ assigneeId: 'p1' }))).toMatchObject({ assigneeId: 'p1' });
  });

  it('is null while a field is empty or the email is not one', () => {
    expect(toUpdateRequest(filled({ personName: ' ' }))).toBeNull();
    expect(toUpdateRequest(filled({ details: '' }))).toBeNull();
    expect(toUpdateRequest(filled({ personEmail: 'asha' }))).toBeNull();
  });
});

describe('toCreateRequest', () => {
  it('adds the source and the moment received', () => {
    const request = toCreateRequest(filled({ source: 'email' }));
    expect(request).toMatchObject({ source: 'email', personName: 'Asha Rao' });
    expect(request?.receivedAt).toBe(new Date(2026, 10, 10, 9, 30).toISOString());
  });

  it('is null without a date', () => {
    expect(toCreateRequest(filled({ receivedDate: null }))).toBeNull();
  });
});

describe('requestValuesOf', () => {
  it('puts a saved request back into the form', () => {
    const request = {
      type: 'complaint',
      source: 'email',
      personName: 'Ravi',
      personEmail: 'ravi@example.com',
      details: 'Too many emails',
      receivedAt: new Date(2026, 10, 1, 8, 5).toISOString(),
      assignee: { id: 'p1', name: 'Meera' },
    } as RequestResponse;
    expect(requestValuesOf(request)).toMatchObject({
      type: 'complaint',
      personName: 'Ravi',
      receivedDate: '2026-11-01',
      receivedTime: '08:05',
      assigneeId: 'p1',
    });
  });

  it('keeps a request as it stands, with its assignee, for changing one thing', () => {
    const request = {
      type: 'complaint',
      personName: 'Ravi',
      personEmail: 'ravi@example.com',
      details: 'Too many emails',
      assignee: null,
    } as RequestResponse;
    expect(requestUpdateOf(request)).toEqual({
      type: 'complaint',
      personName: 'Ravi',
      personEmail: 'ravi@example.com',
      details: 'Too many emails',
      assigneeId: null,
    });
  });
});

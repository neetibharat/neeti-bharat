import { describe, expect, it } from 'vitest';
import { isApiError, toApiError } from './base-api';

describe('toApiError', () => {
  it('keeps the status and the code the API sent', () => {
    const error = { status: 404, data: { code: 'NOT_FOUND', message: 'ignored' } };
    expect(toApiError(error)).toEqual({ status: 404, code: 'NOT_FOUND' });
  });

  it('falls back to INTERNAL when the body has no code', () => {
    expect(toApiError({ status: 500, data: {} })).toEqual({ status: 500, code: 'INTERNAL' });
    expect(toApiError({ status: 500, data: undefined })).toEqual({ status: 500, code: 'INTERNAL' });
  });

  it('falls back to INTERNAL for a body that is not an object', () => {
    expect(toApiError({ status: 502, data: '<html>bad gateway</html>' }).code).toBe('INTERNAL');
    expect(toApiError({ status: 500, data: null }).code).toBe('INTERNAL');
  });

  it('ignores a code that is not a string', () => {
    expect(toApiError({ status: 500, data: { code: 42 } }).code).toBe('INTERNAL');
  });

  it('keeps the values the message for the code fills in', () => {
    const error = {
      status: 400,
      data: { code: 'CONNECTION_FAILED', params: { reason: 'sign_in' } },
    };
    expect(toApiError(error)).toEqual({
      status: 400,
      code: 'CONNECTION_FAILED',
      params: { reason: 'sign_in' },
    });
  });

  it('leaves out values that are not text or numbers, and keeps the rest', () => {
    const error = {
      status: 409,
      data: { code: 'API_KEY_LIMIT', params: { limit: 25, junk: { a: 1 }, flag: true } },
    };
    expect(toApiError(error).params).toEqual({ limit: 25 });
    expect(toApiError({ status: 400, data: { code: 'X', params: 'nope' } }).params).toBeUndefined();
  });

  it('keeps a textual status from a network failure', () => {
    const error = { status: 'FETCH_ERROR' as const, error: 'Failed to fetch' };
    expect(toApiError(error)).toEqual({ status: 'FETCH_ERROR', code: 'INTERNAL' });
  });
});

describe('isApiError', () => {
  it('recognises objects with a code', () => {
    expect(isApiError({ status: 400, code: 'VALIDATION_FAILED' })).toBe(true);
  });

  it('rejects everything else', () => {
    expect(isApiError(null)).toBe(false);
    expect(isApiError('boom')).toBe(false);
    expect(isApiError(new Error('boom'))).toBe(false);
  });
});

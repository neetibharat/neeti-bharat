import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.validation';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  WEB_ORIGIN: 'http://localhost:3200',
};

describe('validateEnv', () => {
  it('applies the default port', () => {
    expect(validateEnv(valid).API_PORT).toBe(3201);
  });

  it('coerces the port from a string', () => {
    expect(validateEnv({ ...valid, API_PORT: '4000' }).API_PORT).toBe(4000);
  });

  it('rejects a missing database url', () => {
    expect(() => validateEnv({ WEB_ORIGIN: valid.WEB_ORIGIN })).toThrow(/DATABASE_URL/);
  });
});

import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.validation';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  WEB_ORIGIN: 'http://localhost:3200',
  BETTER_AUTH_SECRET: 'x'.repeat(32),
};

describe('validateEnv', () => {
  it('applies the default port', () => {
    expect(validateEnv(valid).API_PORT).toBe(3201);
  });

  it('coerces the port from a string', () => {
    expect(validateEnv({ ...valid, API_PORT: '4000' }).API_PORT).toBe(4000);
  });

  it('rejects a missing database url', () => {
    expect(() => validateEnv({ ...valid, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
  });

  it('rejects a short auth secret', () => {
    expect(() => validateEnv({ ...valid, BETTER_AUTH_SECRET: 'short' })).toThrow(
      /BETTER_AUTH_SECRET/,
    );
  });

  it('runs without SMTP so links go to the log', () => {
    expect(validateEnv(valid).SMTP_HOST).toBeUndefined();
  });

  it('needs SMTP in production', () => {
    expect(() => validateEnv({ ...valid, NODE_ENV: 'production' })).toThrow(/SMTP_HOST/);
  });

  it('needs a secret with each OAuth client id', () => {
    expect(() => validateEnv({ ...valid, GOOGLE_CLIENT_ID: 'id' })).toThrow(/GOOGLE_CLIENT_ID/);
    expect(() => validateEnv({ ...valid, MICROSOFT_CLIENT_ID: 'id' })).toThrow(
      /MICROSOFT_CLIENT_ID/,
    );
  });

  it('leaves OAuth off by default and uses the common Microsoft tenant', () => {
    const env = validateEnv(valid);
    expect(env.GOOGLE_CLIENT_ID).toBeUndefined();
    expect(env.MICROSOFT_TENANT_ID).toBe('common');
  });

  it('needs a sender when SMTP is on', () => {
    expect(() => validateEnv({ ...valid, SMTP_HOST: 'smtp.example.com' })).toThrow(/SMTP_FROM/);
  });

  it('leaves storage off by default, with the AWS defaults for the rest', () => {
    const env = validateEnv(valid);
    expect(env.STORAGE_BUCKET).toBeUndefined();
    expect(env.STORAGE_REGION).toBe('us-east-1');
    expect(env.STORAGE_FORCE_PATH_STYLE).toBe(false);
  });

  it('treats blank storage settings as not set', () => {
    const env = validateEnv({ ...valid, STORAGE_BUCKET: '', STORAGE_ENDPOINT: '' });
    expect(env.STORAGE_BUCKET).toBeUndefined();
    expect(env.STORAGE_ENDPOINT).toBeUndefined();
  });

  it('reads the path style flag as text', () => {
    expect(
      validateEnv({ ...valid, STORAGE_FORCE_PATH_STYLE: 'true' }).STORAGE_FORCE_PATH_STYLE,
    ).toBe(true);
    expect(
      validateEnv({ ...valid, STORAGE_FORCE_PATH_STYLE: 'false' }).STORAGE_FORCE_PATH_STYLE,
    ).toBe(false);
  });

  it('needs both storage keys or neither', () => {
    const bucket = { ...valid, STORAGE_BUCKET: 'proof' };
    expect(() => validateEnv({ ...bucket, STORAGE_ACCESS_KEY_ID: 'id' })).toThrow(
      /STORAGE_ACCESS_KEY_ID/,
    );
    expect(() => validateEnv({ ...bucket, STORAGE_SECRET_ACCESS_KEY: 's' })).toThrow(
      /STORAGE_ACCESS_KEY_ID/,
    );
    expect(() => validateEnv(bucket)).not.toThrow();
    expect(() =>
      validateEnv({ ...bucket, STORAGE_ACCESS_KEY_ID: 'id', STORAGE_SECRET_ACCESS_KEY: 's' }),
    ).not.toThrow();
  });

  it('rejects an endpoint that is not an address', () => {
    expect(() => validateEnv({ ...valid, STORAGE_ENDPOINT: 'minio' })).toThrow(/STORAGE_ENDPOINT/);
  });
});

import { randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { validateEnv, type Env } from '../config/env.validation';
import { AesSecretBox, DisabledSecretBox, isValidSecretKey } from './secret-box';
import { createSecretBox } from './secrets.module';

const key = () => randomBytes(32).toString('base64');

describe('AesSecretBox', () => {
  it('opens what it sealed', () => {
    const box = new AesSecretBox(key());
    const sealed = box.seal('a client secret', 'org-1:azure');
    expect(box.open(sealed, 'org-1:azure')).toBe('a client secret');
  });

  it('does not show the value in what it keeps, and seals the same value differently each time', () => {
    const box = new AesSecretBox(key());
    const first = box.seal('a client secret', 'org-1');
    expect(first).not.toContain('client');
    expect(box.seal('a client secret', 'org-1')).not.toBe(first);
  });

  it('refuses to open a value for another context, so one organisation cannot be given another’s', () => {
    const box = new AesSecretBox(key());
    const sealed = box.seal('secret', 'org-1');
    expect(() => box.open(sealed, 'org-2')).toThrow();
  });

  it('refuses a value that was changed, and one sealed with another key', () => {
    const box = new AesSecretBox(key());
    const sealed = box.seal('secret', 'org-1');
    const parts = sealed.split('.');
    parts[3] = Buffer.from('tampered').toString('base64url');
    expect(() => box.open(parts.join('.'), 'org-1')).toThrow();
    expect(() => new AesSecretBox(key()).open(sealed, 'org-1')).toThrow();
  });

  it('refuses something that was never sealed', () => {
    expect(() => new AesSecretBox(key()).open('plain text', 'org-1')).toThrow();
  });

  it('refuses a key that is not 32 bytes', () => {
    expect(isValidSecretKey(key())).toBe(true);
    expect(isValidSecretKey(Buffer.from('short').toString('base64'))).toBe(false);
    expect(() => new AesSecretBox('short')).toThrow();
  });
});

describe('createSecretBox', () => {
  const base = {
    DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    WEB_ORIGIN: 'http://localhost:3200',
    BETTER_AUTH_SECRET: 'x'.repeat(32),
  };
  const configFor = (extra: Record<string, string>) =>
    new ConfigService<Env, true>(validateEnv({ ...base, ...extra }));

  it('is off without a key, and says so with a code when asked to seal', () => {
    const box = createSecretBox(configFor({}));
    expect(box).toBeInstanceOf(DisabledSecretBox);
    expect(box.isEnabled()).toBe(false);
    expect(() => box.seal('x', 'c')).toThrowError(
      expect.objectContaining({ code: 'SECRETS_NOT_CONFIGURED' }),
    );
  });

  it('is on with a key', () => {
    const box = createSecretBox(configFor({ SECRETS_ENCRYPTION_KEY: key() }));
    expect(box.isEnabled()).toBe(true);
  });

  it('refuses a key of the wrong length when the app starts', () => {
    expect(() => configFor({ SECRETS_ENCRYPTION_KEY: 'too-short' })).toThrow();
  });
});

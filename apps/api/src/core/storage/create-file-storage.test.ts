import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { validateEnv, type Env } from '../config/env.validation';
import { createFileStorage } from './create-file-storage';
import { DisabledFileStorage } from './disabled-file-storage';
import { S3FileStorage } from './s3-file-storage';

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  WEB_ORIGIN: 'http://localhost:3200',
  BETTER_AUTH_SECRET: 'x'.repeat(32),
};

const configFor = (extra: Record<string, string>) =>
  new ConfigService<Env, true>(validateEnv({ ...base, ...extra }));

describe('createFileStorage', () => {
  it('is off without a bucket', () => {
    const storage = createFileStorage(configFor({}));
    expect(storage).toBeInstanceOf(DisabledFileStorage);
    expect(storage.isEnabled()).toBe(false);
  });

  it('uses S3 once a bucket is set', () => {
    const storage = createFileStorage(configFor({ STORAGE_BUCKET: 'proof' }));
    expect(storage).toBeInstanceOf(S3FileStorage);
    expect(storage.isEnabled()).toBe(true);
  });
});

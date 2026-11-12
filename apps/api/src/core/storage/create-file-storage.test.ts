import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { validateEnv, type Env } from '../config/env.validation';
import { createFileStorage } from './create-file-storage';
import { AzureBlobFileStorage } from './azure-file-storage';
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

  it('uses Azure Blob once its account, key and container are set', () => {
    const storage = createFileStorage(
      configFor({
        AZURE_STORAGE_ACCOUNT: 'devaccount',
        AZURE_STORAGE_KEY: Buffer.from('k').toString('base64'),
        AZURE_STORAGE_CONTAINER: 'proof',
      }),
    );
    expect(storage).toBeInstanceOf(AzureBlobFileStorage);
  });

  it('refuses Azure settings that are only partly there, or set beside S3', () => {
    expect(() => configFor({ AZURE_STORAGE_ACCOUNT: 'devaccount' })).toThrow();
    expect(() =>
      configFor({
        AZURE_STORAGE_ACCOUNT: 'devaccount',
        AZURE_STORAGE_KEY: 'a2V5',
        AZURE_STORAGE_CONTAINER: 'proof',
        STORAGE_BUCKET: 'proof',
      }),
    ).toThrow();
  });
});

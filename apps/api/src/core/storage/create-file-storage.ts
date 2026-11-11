import type { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.validation';
import { DisabledFileStorage } from './disabled-file-storage';
import type { FileStorage } from './file-storage';
import { S3FileStorage } from './s3-file-storage';

/** The only place that decides which driver runs. A new driver is one more branch here. */
export function createFileStorage(config: ConfigService<Env, true>): FileStorage {
  const bucket = config.get('STORAGE_BUCKET', { infer: true });
  if (!bucket) return new DisabledFileStorage();
  return new S3FileStorage({
    bucket,
    region: config.get('STORAGE_REGION', { infer: true }),
    endpoint: config.get('STORAGE_ENDPOINT', { infer: true }),
    accessKeyId: config.get('STORAGE_ACCESS_KEY_ID', { infer: true }),
    secretAccessKey: config.get('STORAGE_SECRET_ACCESS_KEY', { infer: true }),
    forcePathStyle: config.get('STORAGE_FORCE_PATH_STYLE', { infer: true }),
  });
}

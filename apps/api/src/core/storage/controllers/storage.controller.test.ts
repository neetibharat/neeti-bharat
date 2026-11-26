import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { EVIDENCE_FILE_MAX_BYTES } from '@neeti-bharat/shared';
import { DisabledFileStorage } from '../disabled-file-storage';
import { FileStorage } from '../file-storage';
import { MemoryFileStorage } from '../memory-file-storage';
import { StorageService } from '../services/storage.service';
import { StorageController } from './storage.controller';

async function createApp(storage: FileStorage): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [StorageController],
    providers: [StorageService, { provide: FileStorage, useValue: storage }],
  }).compile();
  const app = moduleRef.createNestApplication();
  app.useLogger(false);
  await app.init();
  return app;
}

describe('GET /storage', () => {
  let app: INestApplication;

  afterEach(async () => {
    await app.close();
  });

  it('says uploads are on, with the limit and the accepted types', async () => {
    app = await createApp(new MemoryFileStorage());
    const res = await request(app.getHttpServer()).get('/storage');
    expect(res.status).toBe(200);
    expect(res.body.enabled).toBe(true);
    expect(res.body.maxBytes).toBe(EVIDENCE_FILE_MAX_BYTES);
    expect(res.body.allowedTypes).toEqual(expect.arrayContaining(['pdf', 'png', 'docx', 'zip']));
  });

  it('says uploads are off when no storage is set up', async () => {
    app = await createApp(new DisabledFileStorage());
    const res = await request(app.getHttpServer()).get('/storage');
    expect(res.body.enabled).toBe(false);
  });
});

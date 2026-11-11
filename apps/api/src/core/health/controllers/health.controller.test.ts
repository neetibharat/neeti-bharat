import { INestApplication } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { AllExceptionsFilter } from '../../common/all-exceptions.filter';
import { HealthController } from './health.controller';
import { HealthRepository } from '../repositories/health.repository';
import { HealthService } from '../services/health.service';

async function createApp(ping: () => Promise<void>): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [
      HealthService,
      { provide: HealthRepository, useValue: { ping } },
      { provide: APP_FILTER, useClass: AllExceptionsFilter },
    ],
  }).compile();
  const app = moduleRef.createNestApplication();
  app.useLogger(false);
  await app.init();
  return app;
}

describe('GET /health', () => {
  let app: INestApplication;

  afterEach(async () => {
    await app.close();
  });

  it('reports ok when the database answers', async () => {
    app = await createApp(async () => undefined);
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'up' });
  });

  it('returns an INTERNAL error body when the database is down', async () => {
    app = await createApp(async () => {
      throw new Error('connection refused');
    });
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ statusCode: 500, code: 'INTERNAL' });
  });
});

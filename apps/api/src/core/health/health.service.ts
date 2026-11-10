import { Injectable } from '@nestjs/common';
import type { HealthResponse } from '@niti-bharat/shared';
import { HealthRepository } from './health.repository';

@Injectable()
export class HealthService {
  constructor(private readonly repository: HealthRepository) {}

  /** Throws when the database is unreachable. */
  async check(): Promise<HealthResponse> {
    await this.repository.ping();
    return { status: 'ok', database: 'up' };
  }
}

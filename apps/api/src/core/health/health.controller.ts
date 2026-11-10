import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@niti-bharat/shared';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly service: HealthService) {}

  @Get()
  check(): Promise<HealthResponse> {
    return this.service.check();
  }
}

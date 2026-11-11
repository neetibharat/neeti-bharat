import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@dpdp-kit/shared';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { HealthService } from '../services/health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly service: HealthService) {}

  @Get()
  @AllowAnonymous()
  check(): Promise<HealthResponse> {
    return this.service.check();
  }
}

import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthProvidersResponse } from '@neeti-bharat/shared';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import type { Env } from '../../core/config/env.validation';

@ApiTags('Auth')
@Controller('auth/providers')
export class ProvidersController {
  constructor(private readonly config: ConfigService<Env, true>) {}

  @Get()
  @AllowAnonymous()
  @ApiOperation({ summary: 'Which sign-in methods besides the email link are on' })
  providers(): AuthProvidersResponse {
    return {
      google: Boolean(this.config.get('GOOGLE_CLIENT_ID', { infer: true })),
      microsoft: Boolean(this.config.get('MICROSOFT_CLIENT_ID', { infer: true })),
    };
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AppRole, MeResponse } from '@dpdp-kit/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('Auth')
@ApiCookieAuth()
@Controller('me')
export class MeController {
  @Get()
  @ApiOperation({ summary: 'The signed-in person' })
  me(@Session() { user }: UserSession): MeResponse {
    return { id: user.id, name: user.name, email: user.email, role: user.role as AppRole };
  }
}

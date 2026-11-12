import { Controller, HttpCode, Post, Get } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { OrganizationListResponse } from '@dpdp-kit/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { actorOf } from '../../core/common/actor';
import { NoOrganization, Roles } from '../../core/org/roles.decorator';
import { OrganizationsService } from '../services/organizations.service';

@ApiTags('Organizations')
@ApiCookieAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Get()
  @NoOrganization()
  @ApiOperation({
    summary: 'The organisations the signed-in person can open, with their role in each',
  })
  list(@Session() { user }: UserSession): Promise<OrganizationListResponse> {
    return this.service.listFor(user.id);
  }

  @Post('current/onboarding')
  @HttpCode(204)
  @Roles(['admin'])
  @ApiOperation({ summary: 'End the set-up of the organisation, finished or skipped (admin only)' })
  completeOnboarding(@Session() { user }: UserSession): Promise<void> {
    return this.service.completeOnboarding(actorOf(user));
  }
}

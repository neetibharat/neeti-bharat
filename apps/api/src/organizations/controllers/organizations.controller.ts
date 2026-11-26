import { Body, Controller, HttpCode, Post, Get } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { OrganizationListResponse } from '@neeti-bharat/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { actorOf } from '../../core/common/actor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import { NoApiKey, NoOrganization, Roles } from '../../core/org/roles.decorator';
import {
  CloseOrganizationDto,
  closeOrganizationSchema,
  type CloseOrganizationInput,
} from '../dto/organization.dto';
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

  @Post('current/close')
  @HttpCode(204)
  @Roles(['admin'])
  @NoApiKey()
  @ApiOperation({
    summary:
      'Close the organisation. Nobody can open it afterwards, and nothing is erased. The name must be typed out (admin only, never a key)',
  })
  @ApiBody({ type: CloseOrganizationDto })
  close(
    @Body(new ZodValidationPipe(closeOrganizationSchema)) body: CloseOrganizationInput,
    @Session() { user }: UserSession,
  ): Promise<void> {
    return this.service.close(body.name, actorOf(user));
  }
}

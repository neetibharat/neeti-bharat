import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { OrganizationSummary } from '@dpdp-kit/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import { NoOrganization } from '../../core/org/roles.decorator';
import {
  CreateOrganizationDto,
  createOrganizationSchema,
  type CreateOrganizationInput,
} from '../dto/organization.dto';
import { OrganizationSetupService } from '../services/organization-setup.service';

@ApiTags('Organizations')
@ApiCookieAuth()
@Controller('organizations')
export class OrganizationSetupController {
  constructor(private readonly service: OrganizationSetupService) {}

  @Post()
  @NoOrganization()
  @ApiOperation({
    summary:
      'Create an organisation. The signed-in person becomes its admin and it starts with the DPDP checklist',
  })
  @ApiBody({ type: CreateOrganizationDto })
  create(
    @Body(new ZodValidationPipe(createOrganizationSchema)) body: CreateOrganizationInput,
    @Session() { user }: UserSession,
  ): Promise<OrganizationSummary> {
    return this.service.create(body.name, { id: user.id, email: user.email, name: user.name });
  }
}

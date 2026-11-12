import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JobRole, RoleHoldersResponse } from '@dpdp-kit/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { Roles } from '../../core/org/roles.decorator';
import { actorOf } from '../../core/common/actor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import {
  AssignRoleDto,
  assignRoleSchema,
  jobRoleSchema,
  type AssignRoleInput,
} from '../dto/people.dto';
import { PeopleService } from '../services/people.service';
import { RoleService } from '../services/role.service';

@ApiTags('People')
@ApiCookieAuth()
@Roles(['admin'])
@Controller('roles')
export class RolesController {
  constructor(
    private readonly service: RoleService,
    private readonly people: PeopleService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Who holds each job role (admin only)' })
  holders(): Promise<RoleHoldersResponse> {
    return this.people.roleHolders();
  }

  @Put(':role')
  @ApiOperation({
    summary: 'Give a job role to a person, or leave it vacant with null (admin only)',
  })
  @ApiBody({ type: AssignRoleDto })
  async assign(
    @Param('role', new ZodValidationPipe(jobRoleSchema)) role: JobRole,
    @Body(new ZodValidationPipe(assignRoleSchema)) body: AssignRoleInput,
    @Session() session: UserSession,
  ): Promise<void> {
    await this.service.assign(role, body.personId, actorOf(session.user));
  }
}

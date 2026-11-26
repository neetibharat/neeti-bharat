import { Body, Controller, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type {
  LeaveResponse,
  PeopleListResponse,
  PersonOptionsResponse,
  PersonResponse,
} from '@neeti-bharat/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { Roles } from '../../core/org/roles.decorator';
import { actorOf } from '../../core/common/actor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import { AccessChangeService } from '../services/access-change.service';
import {
  AddPersonDto,
  SetAccessDto,
  UpdatePersonDto,
  addPersonSchema,
  listPeopleSchema,
  setAccessSchema,
  updatePersonSchema,
  type AddPersonInput,
  type ListPeopleQuery,
  type SetAccessInput,
  type UpdatePersonInput,
} from '../dto/people.dto';
import { PeopleService } from '../services/people.service';

@ApiTags('People')
@ApiCookieAuth()
@Roles(['admin'])
@Controller('people')
export class PeopleController {
  constructor(
    private readonly service: PeopleService,
    private readonly access: AccessChangeService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'One page of people, with their access and the job roles they hold (admin only)',
  })
  @ApiQuery({ name: 'status', required: false, description: 'active (default) or left' })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search name, email, job title or department',
  })
  @ApiQuery({ name: 'page', required: false, description: 'From 1, default 1' })
  @ApiQuery({ name: 'limit', required: false, description: '1 to 100, default 25' })
  list(
    @Query(new ZodValidationPipe(listPeopleSchema)) query: ListPeopleQuery,
  ): Promise<PeopleListResponse> {
    return this.service.list(query);
  }

  @Get('options')
  @ApiOperation({ summary: 'Active people as id and name, for pickers (admin only)' })
  options(): Promise<PersonOptionsResponse> {
    return this.service.options();
  }

  // After `options`, so that "options" is not read as a person's id.
  @Get(':id')
  @ApiOperation({
    summary: 'One person, with their access and the job roles they hold (admin only)',
  })
  get(@Param('id') id: string): Promise<PersonResponse> {
    return this.service.get(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Add a person and invite them to sign in with the given role (admin only)',
  })
  @ApiBody({ type: AddPersonDto })
  add(
    @Body(new ZodValidationPipe(addPersonSchema)) body: AddPersonInput,
    @Session() session: UserSession,
  ): Promise<PersonResponse> {
    return this.service.add(body, actorOf(session.user));
  }

  @Patch(':id')
  @ApiOperation({ summary: "Change a person's name, department or job title (admin only)" })
  @ApiBody({ type: UpdatePersonDto })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePersonSchema)) body: UpdatePersonInput,
    @Session() session: UserSession,
  ): Promise<PersonResponse> {
    return this.service.update(id, body, actorOf(session.user));
  }

  @Post(':id/resend-invitation')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Send an invitation again with a fresh last day, even if it ran out (admin only)',
  })
  resendInvitation(
    @Param('id') id: string,
    @Session() session: UserSession,
  ): Promise<PersonResponse> {
    return this.service.resendInvitation(id, actorOf(session.user));
  }

  @Put(':id/access')
  @ApiOperation({
    summary: 'Change what a person can do. The last admin cannot be demoted (admin only)',
  })
  @ApiBody({ type: SetAccessDto })
  async setAccess(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setAccessSchema)) body: SetAccessInput,
    @Session() session: UserSession,
  ): Promise<void> {
    await this.access.setAccess(id, body.access, actorOf(session.user));
  }

  @Post(':id/leave')
  @ApiOperation({
    summary: 'Mark a person as left: ends their login and frees their roles (admin only)',
  })
  leave(@Param('id') id: string, @Session() session: UserSession): Promise<LeaveResponse> {
    return this.access.leave(id, actorOf(session.user));
  }
}

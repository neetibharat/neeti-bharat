import { Controller, Get, Param } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { MyWorkResponse, MyWorkTeamResponse } from '@dpdp-kit/shared';
import { Roles, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { MyWorkService } from '../services/my-work.service';

@ApiTags('Frameworks')
@ApiCookieAuth()
@Controller('my-work')
export class MyWorkController {
  constructor(private readonly service: MyWorkService) {}

  @Get()
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'What is waiting on the signed-in person, most urgent first' })
  mine(@Session() session: UserSession): Promise<MyWorkResponse> {
    return this.service.forUser(session.user);
  }

  @Get('team')
  @Roles(['admin'])
  @ApiOperation({ summary: 'How much is waiting on each person' })
  team(): Promise<MyWorkTeamResponse> {
    return this.service.team();
  }

  @Get('of/:personId')
  @Roles(['admin'])
  @ApiOperation({ summary: 'What is waiting on one person, most urgent first' })
  of(@Param('personId') personId: string): Promise<MyWorkResponse> {
    return this.service.forPerson(personId);
  }
}

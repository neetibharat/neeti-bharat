import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  POLICY_ACCEPTANCE_PAGE_SIZE,
  type MyPoliciesResponse,
  type TeamPoliciesResponse,
} from '@dpdp-kit/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { z } from 'zod';
import { actorOf } from '../../core/common/actor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import { Roles } from '../../core/org/roles.decorator';
import { PolicyAcceptanceService } from '../services/policy-acceptance.service';

const teamSchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(POLICY_ACCEPTANCE_PAGE_SIZE),
});
type TeamQuery = z.output<typeof teamSchema>;

@ApiTags('Policies')
@ApiCookieAuth()
@Controller('policy-acceptance')
export class PolicyAcceptanceController {
  constructor(private readonly service: PolicyAcceptanceService) {}

  @Get('mine')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({
    summary: 'The approved policies, with the day the signed-in person accepted each',
  })
  mine(@Session() { user }: UserSession): Promise<MyPoliciesResponse> {
    return this.service.mine(user);
  }

  @Get('of/:personId')
  @Roles(['admin', 'auditor'])
  @ApiOperation({ summary: 'The approved policies, with the day one person accepted each' })
  of(@Param('personId') personId: string): Promise<MyPoliciesResponse> {
    return this.service.forPerson(personId);
  }

  @Get('team')
  @Roles(['admin', 'auditor'])
  @ApiOperation({ summary: 'One page of people, with how many policies each has accepted' })
  @ApiQuery({ name: 'q', required: false, description: 'Search name or email' })
  @ApiQuery({ name: 'page', required: false, description: 'From 1, default 1' })
  @ApiQuery({ name: 'limit', required: false, description: '1 to 100, default 25' })
  team(@Query(new ZodValidationPipe(teamSchema)) query: TeamQuery): Promise<TeamPoliciesResponse> {
    return this.service.team(query);
  }

  @Post(':policyId/accept')
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Accept an approved policy as yourself (admin or member)' })
  accept(
    @Param('policyId') policyId: string,
    @Session() { user }: UserSession,
  ): Promise<MyPoliciesResponse> {
    return this.service.accept(policyId, user, actorOf(user), new Date());
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { ActivityListResponse, ActivityVerifyResponse } from '@dpdp-kit/shared';
import { Roles } from '@thallesp/nestjs-better-auth';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import { ActivityService } from '../services/activity.service';
import { listActivitySchema, type ListActivityQuery } from '../dto/list-activity.dto';

@ApiTags('Activity log')
@ApiCookieAuth()
@Roles(['admin'])
@Controller('activity')
export class ActivityController {
  constructor(private readonly service: ActivityService) {}

  @Get()
  @ApiOperation({ summary: 'The activity log, newest first (admin only)' })
  @ApiQuery({ name: 'page', required: false, description: 'From 1, default 1' })
  @ApiQuery({ name: 'limit', required: false, description: '1 to 100, default 25' })
  @ApiQuery({ name: 'action', required: false, description: 'Only this kind of change' })
  list(
    @Query(new ZodValidationPipe(listActivitySchema)) query: ListActivityQuery,
  ): Promise<ActivityListResponse> {
    return this.service.list(query);
  }

  @Get('verify')
  @ApiOperation({ summary: 'Check that no event has been changed or removed (admin only)' })
  verify(): Promise<ActivityVerifyResponse> {
    return this.service.verify();
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { DeadlinesResponse } from '@neeti-bharat/shared';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import { Roles } from '../../core/org/roles.decorator';
import { listDeadlinesSchema, type ListDeadlinesQuery } from '../dto/deadlines.dto';
import { DeadlinesService } from '../services/deadlines.service';

@ApiTags('Frameworks')
@ApiCookieAuth()
@Controller('deadlines')
export class DeadlinesController {
  constructor(private readonly service: DeadlinesService) {}

  @Get()
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({
    summary:
      'One page of the company deadlines on a tab, earliest first, with the counts for each tab',
  })
  @ApiQuery({ name: 'tab', required: false, description: 'overdue (default), week or later' })
  @ApiQuery({ name: 'page', required: false, description: 'From 1, default 1' })
  @ApiQuery({ name: 'limit', required: false, description: '1 to 100, default 25' })
  list(
    @Query(new ZodValidationPipe(listDeadlinesSchema)) query: ListDeadlinesQuery,
  ): Promise<DeadlinesResponse> {
    return this.service.list(query, new Date());
  }
}

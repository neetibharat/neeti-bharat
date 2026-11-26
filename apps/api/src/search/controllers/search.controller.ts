import { Controller, Get, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { SearchResponse } from '@neeti-bharat/shared';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import { Roles } from '../../core/org/roles.decorator';
import { searchSchema, type SearchQuery } from '../dto/search.dto';
import { SearchService } from '../services/search.service';

@ApiTags('Search')
@ApiCookieAuth()
@Controller('search')
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get()
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'A few matching records of each kind, for the global search' })
  @ApiQuery({ name: 'q', description: 'At least 2 characters' })
  find(@Query(new ZodValidationPipe(searchSchema)) query: SearchQuery): Promise<SearchResponse> {
    return this.service.find(query.q);
  }
}

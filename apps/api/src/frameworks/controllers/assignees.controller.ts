import { Controller, Get } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AssigneesResponse } from '@dpdp-kit/shared';
import { Roles } from '../../core/org/roles.decorator';
import { ControlEditService } from '../services/control-edit.service';

@ApiTags('Frameworks')
@ApiCookieAuth()
@Roles(['admin', 'member'])
@Controller('assignees')
export class AssigneesController {
  constructor(private readonly service: ControlEditService) {}

  @Get()
  @ApiOperation({ summary: 'The people work can be given to (admin and member)' })
  assignees(): Promise<AssigneesResponse> {
    return this.service.assignees();
  }
}

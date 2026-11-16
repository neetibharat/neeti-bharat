import { Controller, Get } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { StorageStatusResponse } from '@dpdp-kit/shared';
import { Roles } from '../../org/roles.decorator';
import { StorageService } from '../services/storage.service';

@ApiTags('Storage')
@ApiCookieAuth()
@Controller('storage')
export class StorageController {
  constructor(private readonly service: StorageService) {}

  @Get()
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'Whether file uploads are set up, the size limit and accepted types' })
  status(): StorageStatusResponse {
    return this.service.status();
  }
}

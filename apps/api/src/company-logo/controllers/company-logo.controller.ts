import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LOGO_MAX_BYTES, type CompanyLogoResponse } from '@neeti-bharat/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { Roles } from '../../core/org/roles.decorator';
import { actorOf } from '../../core/common/actor';
import {
  BodyFirstTransactionInterceptor,
  TransactionAfterBody,
} from '../../core/prisma/transaction.interceptor';
import type { UploadedFile as Upload } from '../../frameworks/utils/evidence-file';
import { CompanyLogoService } from '../services/company-logo.service';

// Memory storage: the picture is checked and sent on in one step, and nothing is left on disk.
const UPLOAD = {
  limits: { fileSize: LOGO_MAX_BYTES, files: 1, fields: 0 },
  // Browsers send file names as UTF-8; multer would otherwise read them as Latin-1.
  defParamCharset: 'utf8',
};

class UploadLogoDto {
  file!: unknown;
}

@ApiTags('Company logo')
@ApiCookieAuth()
@Controller('company-logo')
export class CompanyLogoController {
  constructor(private readonly service: CompanyLogoService) {}

  @Get()
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({
    summary: 'The company logo with a short-lived link to it, or null when none is set',
  })
  get(): Promise<CompanyLogoResponse> {
    return this.service.get();
  }

  @Put()
  @Roles(['admin'])
  @TransactionAfterBody()
  @UseInterceptors(FileInterceptor('file', UPLOAD), BodyFirstTransactionInterceptor)
  @ApiOperation({ summary: 'Set the company logo, replacing any there (admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadLogoDto })
  set(
    @UploadedFile() file: Upload | undefined,
    @Session() session: UserSession,
  ): Promise<CompanyLogoResponse> {
    return this.service.set(file, actorOf(session.user));
  }

  @Delete()
  @HttpCode(204)
  @Roles(['admin'])
  @ApiOperation({ summary: 'Remove the company logo (admin only)' })
  remove(@Session() session: UserSession): Promise<void> {
    return this.service.remove(actorOf(session.user));
  }
}

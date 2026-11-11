import { Controller, Get, HttpStatus, Param, Res, StreamableFile } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { EXPORT_DATASETS, type ExportDataset } from '@dpdp-kit/shared';
import { Roles, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { Response } from 'express';
import { actorOf } from '../../core/common/actor';
import { AppException } from '../../core/common/app.exception';
import { attachmentDisposition } from '../../core/storage/content-disposition';
import { AuditPackService } from '../services/audit-pack.service';
import { ExportService } from '../services/export.service';
import { dayStamp } from '../utils/zip-names';

const isDataset = (value: string): value is ExportDataset =>
  (EXPORT_DATASETS as readonly string[]).includes(value);

/** Downloads for auditors and the team. Each one is written to the activity log. */
@ApiTags('Exports')
@ApiCookieAuth()
@Controller('exports')
export class ExportsController {
  constructor(
    private readonly exports: ExportService,
    private readonly pack: AuditPackService,
  ) {}

  @Get('csv/:dataset')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'One list as a CSV file: the whole table, not a page' })
  @ApiParam({ name: 'dataset', enum: EXPORT_DATASETS })
  async csv(
    @Param('dataset') dataset: string,
    @Session() session: UserSession,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    if (!isDataset(dataset)) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    const { fileName, body } = await this.exports.csv(dataset, actorOf(session.user));
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': attachmentDisposition(fileName),
      'Cache-Control': 'no-store',
    });
    return new StreamableFile(Buffer.from(body, 'utf8'));
  }

  @Get('audit-pack')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({
    summary: 'Every list, the approved policy texts and the proof files, as one zip',
  })
  async auditPack(@Session() session: UserSession, @Res() res: Response): Promise<void> {
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': attachmentDisposition(`audit-pack-${dayStamp(new Date())}.zip`),
      'Cache-Control': 'no-store',
    });
    await this.pack.write(actorOf(session.user), {
      write: (chunk) => void res.write(chunk),
      end: (error) => (error ? res.destroy(error) : res.end()),
    });
  }
}

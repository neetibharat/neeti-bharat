import { Controller, Get, HttpStatus, Param, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EXPORT_DATASETS, type ExportDataset } from '@dpdp-kit/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { Roles } from '../../core/org/roles.decorator';
import type { Response } from 'express';
import { actorOf } from '../../core/common/actor';
import { AppException } from '../../core/common/app.exception';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import { attachmentDisposition } from '../../core/storage/content-disposition';
import { exportRangeSchema, type ExportRange } from '../dto/export-range.dto';
import { AuditPackService } from '../services/audit-pack.service';
import { EvidencePackService } from '../services/evidence-pack.service';
import { ExportService } from '../services/export.service';
import { dayStamp, safeName } from '../utils/zip-names';

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
    private readonly evidencePack: EvidencePackService,
  ) {}

  @Get('csv/:dataset')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({
    summary:
      'One list as a CSV file: the whole table, not a page. Proof, breaches, requests and the activity log can be cut to a range of days',
  })
  @ApiParam({ name: 'dataset', enum: EXPORT_DATASETS })
  @ApiQuery({ name: 'from', required: false, description: 'First day, YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, description: 'Last day, YYYY-MM-DD, included' })
  async csv(
    @Param('dataset') dataset: string,
    @Query(new ZodValidationPipe(exportRangeSchema)) range: ExportRange,
    @Session() session: UserSession,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    if (!isDataset(dataset)) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    const { fileName, body } = await this.exports.csv(dataset, actorOf(session.user), range);
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

  @Get('evidence-pack/:frameworkId/:ruleId')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({
    summary:
      'One rule as a zip: its controls, the approved policies behind them, the proof, and what was done about it',
  })
  async evidence(
    @Param('frameworkId') frameworkId: string,
    @Param('ruleId') ruleId: string,
    @Session() session: UserSession,
    @Res() res: Response,
  ): Promise<void> {
    const target = await this.evidencePack.load(frameworkId, ruleId);
    const name = safeName(`evidence-pack-${target.page.rule.reference}-${dayStamp(new Date())}`);
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': attachmentDisposition(`${name}.zip`),
      'Cache-Control': 'no-store',
    });
    await this.evidencePack.write(target, actorOf(session.user), {
      write: (chunk) => void res.write(chunk),
      end: (error) => (error ? res.destroy(error) : res.end()),
    });
  }
}

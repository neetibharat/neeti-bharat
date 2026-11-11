import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  WebsiteCheckListResponse,
  WebsiteCheckResponse,
  WebsiteCheckResult,
  WebsiteCheckSummary,
} from '@dpdp-kit/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import type { WebsiteCheck } from '../../generated/prisma/client';
import { ProfileService } from '../../profile/services/profile.service';
import {
  WebsiteCheckRepository,
  type WebsiteCheckSummaryRow,
} from '../repositories/website-check.repository';
import { FetchFailure } from '../utils/fetch-page';
import { runChecks, tally, unreachable } from '../utils/page-checks';
import { parseSiteUrl } from '../utils/site-url';
import { SiteReader } from './site-reader';

const toSummary = (row: WebsiteCheckSummaryRow): WebsiteCheckSummary => ({
  id: row.id,
  url: row.url,
  checkedAt: row.checkedAt.toISOString(),
  checkedByName: row.checkedByName,
  passed: row.passed,
  warned: row.warned,
  failed: row.failed,
});

// The results were written by this service in this shape, so they are read back as they were saved.
const toResponse = (row: WebsiteCheck): WebsiteCheckResponse => ({
  ...toSummary(row),
  results: row.results as unknown as WebsiteCheckResult[],
});

@Injectable()
export class WebsiteChecksService {
  constructor(
    private readonly checks: WebsiteCheckRepository,
    private readonly reader: SiteReader,
    private readonly profile: ProfileService,
    private readonly activity: ActivityService,
  ) {}

  async list(page: number, limit: number): Promise<WebsiteCheckListResponse> {
    const { rows, total } = await this.checks.list(page, limit);
    return { items: rows.map(toSummary), total, page, pageSize: limit };
  }

  async get(id: string): Promise<WebsiteCheckResponse> {
    const row = await this.checks.findById(id);
    if (!row) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    return toResponse(row);
  }

  /** Visits the site, judges what it finds and keeps the result. A site that cannot be reached is a finding, not an error. */
  async run(input: string, actor: ActivityActor): Promise<WebsiteCheckResponse> {
    const url = parseSiteUrl(input);
    if (!url) throw new AppException('URL_NOT_ALLOWED', HttpStatus.BAD_REQUEST);
    const results = await this.inspect(url);
    const counts = tally(results);
    const row = await this.checks.create({
      url: url.href,
      checkedByName: actor.label,
      results,
      ...counts,
    });
    await this.activity.record({
      actor,
      action: 'WEBSITE_CHECKED',
      subject: { type: 'website_check', id: row.id },
      details: { url: url.hostname, passed: counts.passed, total: results.length },
    });
    return toResponse(row);
  }

  private async inspect(url: URL): Promise<WebsiteCheckResult[]> {
    try {
      const read = await this.reader.read(url);
      const grievanceEmail = await this.grievanceEmail();
      return runChecks({ ...read, grievanceEmail, now: new Date() });
    } catch (error) {
      if (error instanceof FetchFailure) return unreachable(error.reason);
      throw error;
    }
  }

  private async grievanceEmail(): Promise<string> {
    const { entries } = await this.profile.list();
    return entries.find((entry) => entry.key === 'grievanceEmail')?.value ?? '';
  }
}

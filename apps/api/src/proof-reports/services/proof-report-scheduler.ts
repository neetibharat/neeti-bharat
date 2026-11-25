import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../core/config/env.validation';
import { ProofReportService } from './proof-report.service';

const HOUR_MS = 60 * 60 * 1000;

/**
 * Looks once an hour for reports that have something new to say. A restart, or several copies of the API, do no harm: a
 * report is not made again within its gap. It does not run in tests, which call the service themselves.
 */
@Injectable()
export class ProofReportScheduler implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(ProofReportScheduler.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly reports: ProofReportService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  onApplicationBootstrap(): void {
    if (this.config.get('NODE_ENV', { infer: true }) === 'test') return;
    this.timer = setInterval(() => void this.tick(), HOUR_MS);
    this.timer.unref();
    void this.tick();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** One look. It does nothing while the last one is still going. */
  async tick(now = new Date()): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.reports.refreshAll(now);
    } catch (error) {
      this.logger.error('The proof reports failed', error as Error);
    } finally {
      this.running = false;
    }
  }
}

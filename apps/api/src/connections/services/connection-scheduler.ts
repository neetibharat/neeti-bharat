import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../core/config/env.validation';
import { ConnectionScheduleService } from './connection-schedule.service';

const HOUR_MS = 60 * 60 * 1000;

/**
 * Looks for connections that are due for a check once an hour. A restart, or several copies of the API, do no harm: each
 * try is claimed before it is made. It does not run in tests, which call the service themselves.
 */
@Injectable()
export class ConnectionScheduler implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(ConnectionScheduler.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly schedule: ConnectionScheduleService,
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

  /** One look. It does nothing while the last one is still going, as a slow system can take a while. */
  async tick(now = new Date()): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.schedule.runAllDue(now);
    } catch (error) {
      this.logger.error('The scheduled connection checks failed', error as Error);
    } finally {
      this.running = false;
    }
  }
}

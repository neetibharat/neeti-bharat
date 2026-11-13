import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../core/config/env.validation';
import { isNoticeTime } from '../utils/notice-candidates';
import { NotificationScanner } from './notification-scanner';

const HOUR_MS = 60 * 60 * 1000;

/**
 * Looks for due and late work once an hour. From 9:00 in India it makes the day's notices, and nothing is made twice,
 * so a restart, or several copies of the API, do no harm. It does not run in tests, which call the scanner themselves.
 */
@Injectable()
export class NotificationScheduler implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(NotificationScheduler.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly scanner: NotificationScanner,
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

  /** One check. It does nothing before the working day starts, or while the last one is still going. */
  async tick(now = new Date()): Promise<void> {
    if (this.running || !isNoticeTime(now)) return;
    this.running = true;
    try {
      await this.scanner.scanAll(now);
    } catch (error) {
      this.logger.error('The daily notice check failed', error as Error);
    } finally {
      this.running = false;
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NotificationKind, NotificationState } from '@dpdp-kit/shared';
import type { Env } from '../../core/config/env.validation';
import { MailService } from '../../core/mail/mail.service';
import { renderMail } from '../../core/mail/templates';

export interface MailedNotice {
  kind: NotificationKind;
  state: NotificationState;
  title: string;
  dueOn: string | null;
}

/** Emails one notice. A failure is logged and reported, so one bad address does not stop the rest. */
@Injectable()
export class NoticeMailer {
  private readonly logger = new Logger(NoticeMailer.name);

  constructor(
    private readonly mail: MailService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async send(to: string, organization: string, notice: MailedNotice): Promise<boolean> {
    try {
      const url = `${this.config.get('WEB_ORIGIN', { infer: true })}/en/my-work`;
      await this.mail.send({
        to,
        ...renderMail('en', 'notice', { ...notice, dueOn: notice.dueOn ?? '', organization, url }),
      });
      return true;
    } catch (error) {
      this.logger.error(`Could not email a notice to ${to}`, error as Error);
      return false;
    }
  }
}

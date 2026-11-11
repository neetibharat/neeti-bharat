import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import type { Env } from '../config/env.validation';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transport: Transporter | null;
  private readonly from: string;

  constructor(config: ConfigService<Env, true>) {
    const host = config.get('SMTP_HOST', { infer: true });
    this.from = config.get('SMTP_FROM', { infer: true }) ?? '';
    this.transport = host ? createTransport(buildSmtpOptions(config, host)) : null;
  }

  async send(message: MailMessage): Promise<void> {
    if (!this.transport) {
      // Development only: env validation requires SMTP in production, so links never reach a log there.
      this.logger.log(`SMTP is off. Email to ${message.to}: ${message.subject}\n${message.text}`);
      return;
    }
    await this.transport.sendMail({ from: this.from, ...message });
  }
}

function buildSmtpOptions(config: ConfigService<Env, true>, host: string) {
  const port = config.get('SMTP_PORT', { infer: true });
  const user = config.get('SMTP_USER', { infer: true });
  const pass = config.get('SMTP_PASSWORD', { infer: true });
  return { host, port, secure: port === 465, ...(user && pass ? { auth: { user, pass } } : {}) };
}

import { Module, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../core/config/env.validation';
import { MailModule } from '../core/mail/mail.module';
import { MailService } from '../core/mail/mail.service';
import { PrismaService } from '../core/prisma/prisma.service';
import { AccessModule } from './access.module';
import { createAuth, type Auth } from './auth.factory';
import { AccessPolicyService } from './services/access-policy.service';
import { readOAuthSettings } from './utils/oauth-settings';

/** The one Better Auth instance. Both the library's module and the request guard are given this same one. */
export const AUTH = Symbol('BETTER_AUTH_INSTANCE');

const authProvider: Provider = {
  provide: AUTH,
  inject: [ConfigService, PrismaService, MailService, AccessPolicyService],
  useFactory: (
    config: ConfigService<Env, true>,
    prisma: PrismaService,
    mail: MailService,
    access: AccessPolicyService,
  ): Auth =>
    createAuth({
      settings: {
        baseURL: config.get('WEB_ORIGIN', { infer: true }),
        secret: config.get('BETTER_AUTH_SECRET', { infer: true }),
        webOrigin: config.get('WEB_ORIGIN', { infer: true }),
        ...readOAuthSettings(config),
      },
      prisma,
      mail,
      access,
    }),
};

@Module({
  imports: [AccessModule, MailModule],
  providers: [authProvider],
  exports: [AUTH],
})
export class AuthInstanceModule {}

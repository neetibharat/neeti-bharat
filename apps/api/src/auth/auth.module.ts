import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import type { Env } from '../core/config/env.validation';
import { MailModule } from '../core/mail/mail.module';
import { MailService } from '../core/mail/mail.service';
import { PrismaService } from '../core/prisma/prisma.service';
import { AccessModule } from './access.module';
import { AccessPolicyService } from './services/access-policy.service';
import { createAuth } from './auth.factory';
import { MeController } from './controllers/me.controller';
import { readOAuthSettings } from './utils/oauth-settings';
import { ProvidersController } from './controllers/providers.controller';

@Module({
  imports: [
    BetterAuthModule.forRootAsync({
      imports: [AccessModule, MailModule],
      inject: [ConfigService, PrismaService, MailService, AccessPolicyService],
      useFactory: (
        config: ConfigService<Env, true>,
        prisma: PrismaService,
        mail: MailService,
        access: AccessPolicyService,
      ) => ({
        auth: createAuth({
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
      }),
    }),
  ],
  controllers: [MeController, ProvidersController],
})
export class AuthModule {}

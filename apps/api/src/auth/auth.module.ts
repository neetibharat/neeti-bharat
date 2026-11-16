import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { AccessModule } from './access.module';
import { AUTH, AuthInstanceModule } from './auth-instance';
import type { Auth } from './auth.factory';
import { MeController } from './controllers/me.controller';
import { ProvidersController } from './controllers/providers.controller';
import { RequestAccessGuard } from './services/request-access.guard';

@Module({
  imports: [
    BetterAuthModule.forRootAsync({
      imports: [AuthInstanceModule],
      inject: [AUTH],
      // The library's own global guard is switched off: RequestAccessGuard runs it, then the organisation check, in
      // that order, so nothing depends on which module is listed first. The library reads this switch here, not from
      // what the factory returns.
      disableGlobalAuthGuard: true,
      useFactory: (auth: Auth) => ({ auth }),
    }),
    AuthInstanceModule,
    AccessModule,
    ApiKeysModule,
    OrganizationsModule,
  ],
  controllers: [MeController, ProvidersController],
  providers: [{ provide: APP_GUARD, useClass: RequestAccessGuard }],
})
export class AuthModule {}

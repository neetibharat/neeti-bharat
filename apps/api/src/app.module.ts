import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TransactionInterceptor } from './core/prisma/transaction.interceptor';
import { ActivityModule } from './activity/activity.module';
import { AuthModule } from './auth/auth.module';
import { BreachesModule } from './breaches/breaches.module';
import { AllExceptionsFilter } from './core/common/all-exceptions.filter';
import { withOrgStore } from './core/org/org-context';
import { validateEnv } from './core/config/env.validation';
import { ReadinessModule } from './readiness/readiness.module';
import { RequestsModule } from './requests/requests.module';
import { HealthModule } from './core/health/health.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { CompanyLogoModule } from './company-logo/company-logo.module';
import { ConnectionsModule } from './connections/connections.module';
import { ExportsModule } from './exports/exports.module';
import { FrameworksModule } from './frameworks/frameworks.module';
import { PeopleModule } from './people/people.module';
import { ProfileModule } from './profile/profile.module';
import { OrganizationSetupModule } from './organization-setup/organization-setup.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { WebsiteChecksModule } from './website-checks/website-checks.module';
import { StorageModule } from './core/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validate: validateEnv,
    }),
    PrismaModule,
    StorageModule,
    HealthModule,
    AuthModule,
    OrganizationsModule,
    OrganizationSetupModule,
    BreachesModule,
    ReadinessModule,
    RequestsModule,
    ActivityModule,
    ApiKeysModule,
    CompanyLogoModule,
    ConnectionsModule,
    ExportsModule,
    FrameworksModule,
    PeopleModule,
    ProfileModule,
    WebsiteChecksModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransactionInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Every request gets a place to note its organisation, which the guard fills in once it knows who is asking.
    consumer
      .apply((_request: unknown, _response: unknown, next: () => void) => withOrgStore(next))
      .forRoutes('*path');
  }
}

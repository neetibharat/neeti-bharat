import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TransactionInterceptor } from './core/prisma/transaction.interceptor';
import { ActivityModule } from './activity/activity.module';
import { AuthModule } from './auth/auth.module';
import { BreachesModule } from './breaches/breaches.module';
import { AllExceptionsFilter } from './core/common/all-exceptions.filter';
import { validateEnv } from './core/config/env.validation';
import { RequestsModule } from './requests/requests.module';
import { HealthModule } from './core/health/health.module';
import { ExportsModule } from './exports/exports.module';
import { FrameworksModule } from './frameworks/frameworks.module';
import { PeopleModule } from './people/people.module';
import { ProfileModule } from './profile/profile.module';
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
    BreachesModule,
    RequestsModule,
    ActivityModule,
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
export class AppModule {}

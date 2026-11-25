import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { FrameworksModule } from '../frameworks/frameworks.module';
import { SecretsModule } from '../core/secrets/secrets.module';
import { ConnectionsController } from './controllers/connections.controller';
import { AzureConnector, HttpAzureConnector } from './providers/azure/azure-api';
import { ConnectionDrivers } from './providers/connection-drivers';
import { GithubConnector, HttpGithubConnector } from './providers/github/github-api';
import { CheckAcceptanceRepository } from './repositories/check-acceptance.repository';
import { ConnectionRunRepository } from './repositories/connection-run.repository';
import { ConnectionRepository } from './repositories/connection.repository';
import { CheckAcceptanceService } from './services/check-acceptance.service';
import { ConnectionRunService } from './services/connection-run.service';
import { ConnectionScheduleService } from './services/connection-schedule.service';
import { ConnectionScheduler } from './services/connection-scheduler';
import { ConnectionLookupService } from './services/connection-lookup.service';
import { ConnectionsService } from './services/connections.service';

@Module({
  imports: [ActivityModule, FrameworksModule, SecretsModule],
  controllers: [ConnectionsController],
  providers: [
    ConnectionsService,
    ConnectionRunService,
    ConnectionScheduleService,
    ConnectionScheduler,
    ConnectionLookupService,
    ConnectionDrivers,
    ConnectionRepository,
    ConnectionRunRepository,
    CheckAcceptanceRepository,
    CheckAcceptanceService,
    { provide: AzureConnector, useClass: HttpAzureConnector },
    { provide: GithubConnector, useClass: HttpGithubConnector },
  ],
})
export class ConnectionsModule {}

import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { SecretsModule } from '../core/secrets/secrets.module';
import { ConnectionsController } from './controllers/connections.controller';
import { AzureConnector, HttpAzureConnector } from './providers/azure/azure-api';
import { ConnectionDrivers } from './providers/connection-drivers';
import { GithubConnector, HttpGithubConnector } from './providers/github/github-api';
import { ConnectionRunRepository } from './repositories/connection-run.repository';
import { ConnectionRepository } from './repositories/connection.repository';
import { ConnectionLookupService } from './services/connection-lookup.service';
import { ConnectionsService } from './services/connections.service';

@Module({
  imports: [ActivityModule, SecretsModule],
  controllers: [ConnectionsController],
  providers: [
    ConnectionsService,
    ConnectionLookupService,
    ConnectionDrivers,
    ConnectionRepository,
    ConnectionRunRepository,
    { provide: AzureConnector, useClass: HttpAzureConnector },
    { provide: GithubConnector, useClass: HttpGithubConnector },
  ],
})
export class ConnectionsModule {}

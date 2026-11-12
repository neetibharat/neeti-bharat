import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { SecretsModule } from '../core/secrets/secrets.module';
import { ConnectionsController } from './controllers/connections.controller';
import { AzureConnector, HttpAzureConnector } from './providers/azure/azure-api';
import { ConnectionRunRepository } from './repositories/connection-run.repository';
import { ConnectionRepository } from './repositories/connection.repository';
import { ConnectionsService } from './services/connections.service';

@Module({
  imports: [ActivityModule, SecretsModule],
  controllers: [ConnectionsController],
  providers: [
    ConnectionsService,
    ConnectionRepository,
    ConnectionRunRepository,
    { provide: AzureConnector, useClass: HttpAzureConnector },
  ],
})
export class ConnectionsModule {}

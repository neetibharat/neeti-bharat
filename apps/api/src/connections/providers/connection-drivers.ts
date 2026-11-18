import { Injectable } from '@nestjs/common';
import type { ConnectionProvider } from '@dpdp-kit/shared';
import { AzureConnector } from './azure/azure-api';
import { AzureDriver } from './azure/azure-driver';
import type { ConnectionDriver } from './connection-driver';
import { GithubConnector } from './github/github-api';
import { GithubDriver } from './github/github-driver';

/** The way to read each kind of system, so the service can ask for one by the provider a connection is of. */
@Injectable()
export class ConnectionDrivers {
  readonly byProvider: Record<ConnectionProvider, ConnectionDriver>;

  constructor(azure: AzureConnector, github: GithubConnector) {
    this.byProvider = { azure: new AzureDriver(azure), github: new GithubDriver(github) };
  }
}

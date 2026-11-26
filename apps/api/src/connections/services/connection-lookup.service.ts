import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  DiscoverGithubResponse,
  FindSubscriptionsResponse,
  GithubRepositoriesResponse,
} from '@neeti-bharat/shared';
import { AppException } from '../../core/common/app.exception';
import { currentOrganizationId } from '../../core/org/org-context';
import { SecretBox } from '../../core/secrets/secret-box';
import type { DiscoverGithubInput, FindSubscriptionsInput } from '../dto/connection.dto';
import { AzureConnector } from '../providers/azure/azure-api';
import { GithubConnector, type GithubCredentials } from '../providers/github/github-api';
import { ConnectionRepository } from '../repositories/connection.repository';
import { failureOf } from '../utils/connection-mapper';

/**
 * Asks a system what it can see, so the person chooses from a list instead of copying an id: the subscriptions an Azure
 * app registration can see, and the organisations and repositories a GitHub App is installed on. Nothing is kept, and a
 * secret is used for that one sign-in.
 */
@Injectable()
export class ConnectionLookupService {
  constructor(
    private readonly connections: ConnectionRepository,
    private readonly secrets: SecretBox,
    private readonly azure: AzureConnector,
    private readonly github: GithubConnector,
  ) {}

  async findSubscriptions(input: FindSubscriptionsInput): Promise<FindSubscriptionsResponse> {
    const found = await this.asking('azure', () => this.azure.subscriptions(input));
    const items = found.map((item) => ({
      id: item.subscriptionId,
      name: item.displayName ?? item.subscriptionId,
    }));
    return { items: items.sort((a, b) => a.name.localeCompare(b.name)) };
  }

  async discoverGithub(input: DiscoverGithubInput): Promise<DiscoverGithubResponse> {
    const found = await this.asking('github', () => this.github.discover(input));
    return {
      items: found.map((installation) => ({
        id: installation.id,
        account: installation.account.login,
        repositories: installation.repositories,
      })),
    };
  }

  /** The repositories an existing GitHub connection can see, from its own sealed key, to change which it reads. */
  async githubRepositories(id: string): Promise<GithubRepositoriesResponse> {
    const row = await this.connections.findActive(id);
    if (!row || row.provider !== 'github')
      throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    const credentials = JSON.parse(
      this.secrets.open(row.credentials, `${currentOrganizationId()}:connection`),
    ) as GithubCredentials;
    return { items: await this.asking('github', () => this.github.repositories(credentials)) };
  }

  private async asking<T>(provider: string, ask: () => Promise<T>): Promise<T> {
    try {
      return await ask();
    } catch (error) {
      throw new AppException('CONNECTION_FAILED', HttpStatus.BAD_REQUEST, {
        reason: failureOf(error),
        provider,
      });
    }
  }
}

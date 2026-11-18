import { ApiProperty } from '@nestjs/swagger';
import {
  AZURE_ID_PATTERN,
  CONNECTION_MAX_PAGE_SIZE,
  CONNECTION_NAME_MAX_LENGTH,
  CONNECTION_PAGE_SIZE,
  CONNECTION_RUN_PAGE_SIZE,
  CONNECTION_SECRET_MAX_LENGTH,
  GITHUB_ID_PATTERN,
  GITHUB_KEY_MAX_LENGTH,
  GITHUB_REPOSITORIES_MAX,
  GITHUB_REPOSITORY_MODES,
} from '@dpdp-kit/shared';
import { z } from 'zod';

const guid = z.string().trim().regex(AZURE_ID_PATTERN);
const githubId = z.string().trim().regex(GITHUB_ID_PATTERN);
const name = z.string().trim().min(1).max(CONNECTION_NAME_MAX_LENGTH);
/** A name such as acme/api. A comma is how the names are told apart when kept, so none may hold one. */
const repositoryName = z
  .string()
  .trim()
  .regex(/^[\w.-]+\/[\w.-]+$/)
  .max(140);
const privateKey = z
  .string()
  .trim()
  .max(GITHUB_KEY_MAX_LENGTH)
  .regex(/-----BEGIN [A-Z ]*PRIVATE KEY-----/);

const repositories = z
  .object({
    mode: z.enum(GITHUB_REPOSITORY_MODES),
    repositories: z.array(repositoryName).max(GITHUB_REPOSITORIES_MAX),
  })
  .strict();

const azureConnection = z.object({
  provider: z.literal('azure'),
  name,
  credentials: z
    .object({
      tenantId: guid,
      clientId: guid,
      subscriptionId: guid,
      clientSecret: z.string().trim().min(1).max(CONNECTION_SECRET_MAX_LENGTH),
    })
    .strict(),
});

const githubConnection = z.object({
  provider: z.literal('github'),
  name,
  credentials: z.object({ appId: githubId, installationId: githubId, privateKey }).strict(),
  repositories,
});

export const createConnectionSchema = z.discriminatedUnion('provider', [
  azureConnection,
  githubConnection,
]);

export const discoverGithubSchema = z.object({ appId: githubId, privateKey }).strict();

export const findSubscriptionsSchema = z
  .object({
    tenantId: guid,
    clientId: guid,
    clientSecret: z.string().trim().min(1).max(CONNECTION_SECRET_MAX_LENGTH),
  })
  .strict();

/** Which fields may be sent depends on the system the connection is of, which the service checks. */
export const updateConnectionSchema = z
  .object({
    name,
    credentials: z
      .object({
        tenantId: guid.optional(),
        clientId: guid.optional(),
        clientSecret: z.string().trim().min(1).max(CONNECTION_SECRET_MAX_LENGTH).optional(),
        privateKey: privateKey.optional(),
      })
      .strict()
      .optional(),
    repositories: repositories.optional(),
  })
  .strict();

export const listConnectionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(CONNECTION_MAX_PAGE_SIZE).default(CONNECTION_PAGE_SIZE),
});

export const listRunsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(CONNECTION_RUN_PAGE_SIZE),
});

export type CreateConnectionInput = z.output<typeof createConnectionSchema>;
export type DiscoverGithubInput = z.output<typeof discoverGithubSchema>;
export type FindSubscriptionsInput = z.output<typeof findSubscriptionsSchema>;
export type UpdateConnectionInput = z.output<typeof updateConnectionSchema>;
export type ListConnectionsQuery = z.output<typeof listConnectionsSchema>;
export type ListRunsQuery = z.output<typeof listRunsSchema>;

// Swagger reads the request shape from this class; validation uses the schema above.
export class CreateConnectionDto {
  @ApiProperty({ enum: ['azure', 'github'] })
  provider!: string;

  @ApiProperty({ example: 'Production tenant', description: 'A name to tell connections apart.' })
  name!: string;

  @ApiProperty({
    description:
      'Azure: tenantId, clientId and subscriptionId (GUIDs) and clientSecret, of an app registration with read-only access. GitHub: appId, installationId and the privateKey of a read-only GitHub App.',
    example: {
      tenantId: '00000000-0000-0000-0000-000000000000',
      clientId: '00000000-0000-0000-0000-000000000000',
      subscriptionId: '00000000-0000-0000-0000-000000000000',
      clientSecret: '...',
    },
  })
  credentials!: Record<string, string>;
}

export class FindSubscriptionsDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000000' })
  tenantId!: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000000' })
  clientId!: string;

  @ApiProperty({ description: 'Used once to sign in, and not kept.' })
  clientSecret!: string;
}

export class DiscoverGithubDto {
  @ApiProperty({ example: '123456' })
  appId!: string;

  @ApiProperty({
    description:
      'The private key of the App, the text of its .pem file. Used once to sign in, and not kept.',
  })
  privateKey!: string;
}

export class UpdateConnectionDto {
  @ApiProperty({ example: 'Production tenant' })
  name!: string;

  @ApiProperty({
    required: false,
    description:
      'Azure: any of tenantId, clientId and clientSecret. GitHub: a new privateKey. What is left out is kept. The subscription or installation cannot be changed.',
    example: { clientSecret: '...' },
  })
  credentials?: Record<string, string>;

  @ApiProperty({
    required: false,
    description: 'GitHub only: which repositories to read, all or a list of owner/name.',
    example: { mode: 'selected', repositories: ['acme/api'] },
  })
  repositories?: { mode: string; repositories: string[] };
}

import { ApiProperty } from '@nestjs/swagger';
import {
  AZURE_ID_PATTERN,
  CONNECTION_NAME_MAX_LENGTH,
  CONNECTION_PAGE_SIZE,
  CONNECTION_RUN_PAGE_SIZE,
  CONNECTION_SECRET_MAX_LENGTH,
} from '@dpdp-kit/shared';
import { z } from 'zod';

const guid = z.string().trim().regex(AZURE_ID_PATTERN);

export const createConnectionSchema = z.object({
  provider: z.literal('azure'),
  name: z.string().trim().min(1).max(CONNECTION_NAME_MAX_LENGTH),
  credentials: z
    .object({
      tenantId: guid,
      clientId: guid,
      subscriptionId: guid,
      clientSecret: z.string().trim().min(1).max(CONNECTION_SECRET_MAX_LENGTH),
    })
    .strict(),
});

export const listConnectionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(CONNECTION_PAGE_SIZE),
});

export const listRunsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(CONNECTION_RUN_PAGE_SIZE),
});

export type CreateConnectionInput = z.output<typeof createConnectionSchema>;
export type ListConnectionsQuery = z.output<typeof listConnectionsSchema>;
export type ListRunsQuery = z.output<typeof listRunsSchema>;

// Swagger reads the request shape from this class; validation uses the schema above.
export class CreateConnectionDto {
  @ApiProperty({ enum: ['azure'] })
  provider!: string;

  @ApiProperty({ example: 'Production tenant', description: 'A name to tell connections apart.' })
  name!: string;

  @ApiProperty({
    description:
      'For azure: tenantId, clientId and subscriptionId (GUIDs) and clientSecret, of an app registration with read-only access.',
    example: {
      tenantId: '00000000-0000-0000-0000-000000000000',
      clientId: '00000000-0000-0000-0000-000000000000',
      subscriptionId: '00000000-0000-0000-0000-000000000000',
      clientSecret: '...',
    },
  })
  credentials!: Record<string, string>;
}

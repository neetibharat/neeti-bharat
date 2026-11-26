import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  API_KEY_LIFETIMES,
  API_KEY_NAME_MAX_LENGTH,
  API_KEY_PAGE_SIZE,
  API_KEY_ROLES,
} from '@neeti-bharat/shared';
import { z } from 'zod';

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1).max(API_KEY_NAME_MAX_LENGTH),
  role: z.enum(API_KEY_ROLES),
  expiresInDays: z
    .number()
    .refine((days): days is (typeof API_KEY_LIFETIMES)[number] =>
      (API_KEY_LIFETIMES as readonly number[]).includes(days),
    )
    .optional(),
});

export const listApiKeysSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(API_KEY_PAGE_SIZE),
});

export type CreateApiKeyInput = z.output<typeof createApiKeySchema>;
export type ListApiKeysQuery = z.output<typeof listApiKeysSchema>;

// Swagger reads the request shape from this class; validation uses the schema above.
export class CreateApiKeyDto {
  @ApiProperty({ example: 'Claude Code', description: 'What the key is for, shown in the list.' })
  name!: string;

  @ApiProperty({
    enum: API_KEY_ROLES,
    description:
      'What the key can do, as for a person with that role. Any key is refused the API key routes.',
  })
  role!: string;

  @ApiPropertyOptional({
    enum: API_KEY_LIFETIMES,
    description: 'Days until the key stops working. Leave out for a key that does not expire.',
  })
  expiresInDays?: number;
}

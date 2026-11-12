import { ApiProperty } from '@nestjs/swagger';
import { ORGANIZATION_NAME_MAX_LENGTH } from '@dpdp-kit/shared';
import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(ORGANIZATION_NAME_MAX_LENGTH),
});

export type CreateOrganizationInput = z.output<typeof createOrganizationSchema>;

// Swagger reads the request shape from this class; validation uses the schema above.
export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Pvt Ltd', description: 'The company name' })
  name!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const closeOrganizationSchema = z.object({ name: z.string().max(500) });

export type CloseOrganizationInput = z.output<typeof closeOrganizationSchema>;

// Swagger reads the request shape from this class; validation uses the schema above.
export class CloseOrganizationDto {
  @ApiProperty({ description: 'The name of the organisation, typed out to confirm.' })
  name!: string;
}

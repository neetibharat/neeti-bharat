import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PROFILE_LABEL_MAX_LENGTH, PROFILE_VALUE_MAX_LENGTH } from '@dpdp-kit/shared';
import { z } from 'zod';

export const updateProfileEntrySchema = z.object({
  value: z.string().trim().max(PROFILE_VALUE_MAX_LENGTH),
  confirmed: z.boolean().optional(),
});

export const addProfileEntrySchema = z.object({
  label: z.string().trim().min(1).max(PROFILE_LABEL_MAX_LENGTH),
  value: z.string().trim().max(PROFILE_VALUE_MAX_LENGTH),
});

export type UpdateProfileEntryInput = z.output<typeof updateProfileEntrySchema>;
export type AddProfileEntryInput = z.output<typeof addProfileEntrySchema>;

// Swagger reads the request shapes from these classes; validation uses the schemas above.
export class UpdateProfileEntryDto {
  @ApiProperty({ example: '72 hours' })
  value!: string;

  @ApiPropertyOptional({ description: 'Needed to change a legal limit' })
  confirmed?: boolean;
}

export class AddProfileEntryDto {
  @ApiProperty({ example: 'Office address' })
  label!: string;

  @ApiProperty({ example: '12 MG Road, Bengaluru' })
  value!: string;
}

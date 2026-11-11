import { ApiProperty } from '@nestjs/swagger';
import {
  FRAMEWORK_ABOUT_MAX_LENGTH,
  FRAMEWORK_NAME_MAX_LENGTH,
  FRAMEWORK_SEAL_MAX_LENGTH,
  REQUIREMENT_REFERENCE_MAX_LENGTH,
  REQUIREMENT_SUMMARY_MAX_LENGTH,
  REQUIREMENT_TITLE_MAX_LENGTH,
} from '@dpdp-kit/shared';
import { z } from 'zod';

export const saveFrameworkSchema = z.object({
  name: z.string().trim().min(1).max(FRAMEWORK_NAME_MAX_LENGTH),
  about: z.string().trim().max(FRAMEWORK_ABOUT_MAX_LENGTH),
  seal: z.string().trim().min(1).max(FRAMEWORK_SEAL_MAX_LENGTH),
});

export const saveRequirementSchema = z.object({
  reference: z.string().trim().min(1).max(REQUIREMENT_REFERENCE_MAX_LENGTH),
  title: z.string().trim().min(1).max(REQUIREMENT_TITLE_MAX_LENGTH),
  summary: z.string().trim().max(REQUIREMENT_SUMMARY_MAX_LENGTH),
});

export type SaveFrameworkInput = z.output<typeof saveFrameworkSchema>;
export type SaveRequirementInput = z.output<typeof saveRequirementSchema>;

// Swagger reads the request shape from these classes; validation uses the schemas above.
export class SaveFrameworkDto {
  @ApiProperty({ maxLength: FRAMEWORK_NAME_MAX_LENGTH })
  name!: string;

  @ApiProperty({ maxLength: FRAMEWORK_ABOUT_MAX_LENGTH, description: 'One sentence on what it is' })
  about!: string;

  @ApiProperty({ maxLength: FRAMEWORK_SEAL_MAX_LENGTH, description: 'The short mark on its badge' })
  seal!: string;
}

export class SaveRequirementDto {
  @ApiProperty({ maxLength: REQUIREMENT_REFERENCE_MAX_LENGTH, example: '4.2' })
  reference!: string;

  @ApiProperty({ maxLength: REQUIREMENT_TITLE_MAX_LENGTH })
  title!: string;

  @ApiProperty({ maxLength: REQUIREMENT_SUMMARY_MAX_LENGTH, description: 'May be empty' })
  summary!: string;
}

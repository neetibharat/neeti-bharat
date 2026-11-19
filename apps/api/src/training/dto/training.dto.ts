import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TRAINING_ABOUT_MAX_LENGTH,
  TRAINING_NAME_MAX_LENGTH,
  TRAINING_PAGE_SIZE,
  TRAINING_URL_MAX_LENGTH,
} from '@dpdp-kit/shared';
import { z } from 'zod';

/** A web address, http or https only. An empty box means none. */
const webUrl = z
  .string()
  .trim()
  .max(TRAINING_URL_MAX_LENGTH)
  .pipe(z.url({ protocol: /^https?$/ }));
const optionalUrl = z
  .union([z.literal(''), webUrl])
  .transform((value) => value || undefined)
  .optional();
const clearableUrl = z
  .union([z.literal(''), webUrl])
  .transform((value) => value || null)
  .nullable()
  .optional();

const about = z.string().trim().max(TRAINING_ABOUT_MAX_LENGTH);
const name = z.string().trim().min(1).max(TRAINING_NAME_MAX_LENGTH);

export const addTrainingSchema = z.object({
  name,
  about: about.transform((value) => value || undefined).optional(),
  url: optionalUrl,
  repeatsYearly: z.boolean().optional(),
});

export const updateTrainingSchema = z.object({
  name: name.optional(),
  about: about
    .transform((value) => value || null)
    .nullable()
    .optional(),
  url: clearableUrl,
  repeatsYearly: z.boolean().optional(),
});

export const completeTrainingSchema = z.object({
  personId: z.string().min(1).optional(),
});

export const listTeamSchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(TRAINING_PAGE_SIZE),
});

export type AddTrainingInput = z.output<typeof addTrainingSchema>;
export type UpdateTrainingInput = z.output<typeof updateTrainingSchema>;
export type CompleteTrainingInput = z.output<typeof completeTrainingSchema>;
export type ListTeamQuery = z.output<typeof listTeamSchema>;

// Swagger reads the request shapes from these classes; validation uses the schemas above.
export class AddTrainingDto {
  @ApiProperty({ example: 'DPDP Act awareness' })
  name!: string;

  @ApiPropertyOptional({ description: 'What the training teaches' })
  about?: string;

  @ApiPropertyOptional({ description: 'A link to the company’s own video or document' })
  url?: string;

  @ApiPropertyOptional({ description: 'Taken again each year' })
  repeatsYearly?: boolean;
}

export class UpdateTrainingDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  about?: string | null;

  @ApiPropertyOptional({ nullable: true })
  url?: string | null;

  @ApiPropertyOptional()
  repeatsYearly?: boolean;
}

export class CompleteTrainingDto {
  @ApiPropertyOptional({
    description: 'Admins only: the person to record it for. Yourself if not sent.',
  })
  personId?: string;
}

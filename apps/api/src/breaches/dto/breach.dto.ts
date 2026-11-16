import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BREACH_NOTE_MAX_LENGTH,
  BREACH_PAGE_SIZE,
  BREACH_STEPS,
  BREACH_TABS,
  BREACH_TEXT_MAX_LENGTH,
  BREACH_TITLE_MAX_LENGTH,
} from '@dpdp-kit/shared';
import { z } from 'zod';

const text = (max: number) => z.string().trim().min(1).max(max);
const moment = z.iso.datetime({ offset: true }).transform((value) => new Date(value));

const details = {
  title: text(BREACH_TITLE_MAX_LENGTH),
  description: text(BREACH_TEXT_MAX_LENGTH),
  affectedSystems: text(BREACH_TEXT_MAX_LENGTH),
  affectedData: text(BREACH_TEXT_MAX_LENGTH),
};

const peopleAffected = z.number().int().min(0).max(2_000_000_000);
const assigneeId = z.string().min(1);

export const createBreachSchema = z.object({
  ...details,
  foundAt: moment.optional(),
  peopleAffected: peopleAffected.optional(),
  assigneeId: assigneeId.nullable().optional(),
});

export const updateBreachSchema = z.object({
  ...details,
  foundAt: moment,
  peopleAffected: peopleAffected.nullable(),
  assigneeId: assigneeId.nullable(),
});

export const completeStepSchema = z.object({
  note: z
    .string()
    .trim()
    .max(BREACH_NOTE_MAX_LENGTH)
    .transform((value) => value || undefined)
    .optional(),
});

export const stepParamSchema = z.enum(BREACH_STEPS);

export const listBreachesSchema = z.object({
  tab: z.enum(BREACH_TABS).default('open'),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(BREACH_PAGE_SIZE),
});

export type CreateBreachInput = z.output<typeof createBreachSchema>;
export type UpdateBreachInput = z.output<typeof updateBreachSchema>;
export type CompleteStepInput = z.output<typeof completeStepSchema>;
export type ListBreachesQuery = z.output<typeof listBreachesSchema>;

// Swagger reads the request shapes from these classes; validation uses the schemas above.
export class CreateBreachDto {
  @ApiProperty({ example: 'Customer export sent to the wrong address' })
  title!: string;

  @ApiProperty({ description: 'What happened' })
  description!: string;

  @ApiPropertyOptional({ description: 'ISO date and time it was found. Defaults to now.' })
  foundAt?: string;

  @ApiProperty({ description: 'The systems affected, in plain words' })
  affectedSystems!: string;

  @ApiProperty({ description: 'The personal data affected, in plain words' })
  affectedData!: string;

  @ApiPropertyOptional({ description: 'How many people are affected, if known' })
  peopleAffected?: number;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'A person id, or null for the DPO',
  })
  assigneeId?: string | null;
}

export class UpdateBreachDto {
  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ description: 'ISO date and time it was found' })
  foundAt!: string;

  @ApiProperty()
  affectedSystems!: string;

  @ApiProperty()
  affectedData!: string;

  @ApiProperty({ nullable: true })
  peopleAffected!: number | null;

  @ApiProperty({ type: String, nullable: true, description: 'A person id, or null for the DPO' })
  assigneeId!: string | null;
}

export class CompleteStepDto {
  @ApiPropertyOptional({ maxLength: BREACH_NOTE_MAX_LENGTH })
  note?: string;
}

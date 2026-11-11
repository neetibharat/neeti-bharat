import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import {
  REQUEST_BOARD_LIMIT,
  REQUEST_BOARD_MAX_LIMIT,
  REQUEST_EMAIL_MAX_LENGTH,
  REQUEST_NAME_MAX_LENGTH,
  REQUEST_NOTE_MAX_LENGTH,
  REQUEST_PAGE_SIZE,
  REQUEST_REASON_MAX_LENGTH,
  REQUEST_SOURCES,
  REQUEST_SYSTEM_MAX_LENGTH,
  REQUEST_TABS,
  REQUEST_TEXT_MAX_LENGTH,
  REQUEST_TYPES,
  TASK_OUTCOMES,
} from '@dpdp-kit/shared';
import { z } from 'zod';

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || undefined)
    .optional();
const moment = z.iso.datetime({ offset: true }).transform((value) => new Date(value));

const assigneeId = z.string().min(1);

const details = {
  type: z.enum(REQUEST_TYPES),
  personName: text(REQUEST_NAME_MAX_LENGTH),
  personEmail: z.email().max(REQUEST_EMAIL_MAX_LENGTH),
  details: text(REQUEST_TEXT_MAX_LENGTH),
};

export const createRequestSchema = z.object({
  ...details,
  source: z.enum(REQUEST_SOURCES).default('manual'),
  receivedAt: moment.optional(),
  assigneeId: assigneeId.nullable().optional(),
});

export const updateRequestSchema = z.object({ ...details, assigneeId: assigneeId.nullable() });

export const verifyIdentitySchema = z.object({ note: optionalText(REQUEST_NOTE_MAX_LENGTH) });

export const addTaskSchema = z.object({ system: text(REQUEST_SYSTEM_MAX_LENGTH) });

export const updateTaskSchema = z.object({
  outcome: z.enum(TASK_OUTCOMES),
  reason: optionalText(REQUEST_REASON_MAX_LENGTH),
});

// An empty reply gets through: the service refuses it as "not ready", not as a malformed request.
export const closeRequestSchema = z.object({
  replyNote: z.string().trim().max(REQUEST_TEXT_MAX_LENGTH),
});

export const listRequestsSchema = z.object({
  tab: z.enum(REQUEST_TABS).default('new'),
  type: z.enum(REQUEST_TYPES).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(REQUEST_PAGE_SIZE),
});

export const boardRequestsSchema = z.object({
  type: z.enum(REQUEST_TYPES).optional(),
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(REQUEST_BOARD_MAX_LIMIT).default(REQUEST_BOARD_LIMIT),
});

export type CreateRequestInput = z.output<typeof createRequestSchema>;
export type UpdateRequestInput = z.output<typeof updateRequestSchema>;
export type VerifyIdentityInput = z.output<typeof verifyIdentitySchema>;
export type AddTaskInput = z.output<typeof addTaskSchema>;
export type UpdateTaskInput = z.output<typeof updateTaskSchema>;
export type CloseRequestInput = z.output<typeof closeRequestSchema>;
export type ListRequestsQuery = z.output<typeof listRequestsSchema>;
export type BoardRequestsQuery = z.output<typeof boardRequestsSchema>;

// Swagger reads the request shapes from these classes; validation uses the schemas above.
export class UpdateRequestDto {
  @ApiProperty({ enum: REQUEST_TYPES })
  type!: string;

  @ApiProperty({ example: 'Asha Rao' })
  personName!: string;

  @ApiProperty({ example: 'asha@example.com' })
  personEmail!: string;

  @ApiProperty({ description: 'What the person asks for, in their words' })
  details!: string;

  @ApiProperty({ type: String, nullable: true, description: 'A person id, or null for the DPO' })
  assigneeId!: string | null;
}

export class CreateRequestDto extends OmitType(UpdateRequestDto, ['assigneeId'] as const) {
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'A person id, or null for the DPO',
  })
  assigneeId?: string | null;

  @ApiPropertyOptional({
    enum: REQUEST_SOURCES,
    description: 'Where it came from. Defaults to manual.',
  })
  source?: string;

  @ApiPropertyOptional({ description: 'ISO date and time it was received. Defaults to now.' })
  receivedAt?: string;
}

export class VerifyIdentityDto {
  @ApiPropertyOptional({
    maxLength: REQUEST_NOTE_MAX_LENGTH,
    description: 'How the identity was checked',
  })
  note?: string;
}

export class AddTaskDto {
  @ApiProperty({
    maxLength: REQUEST_SYSTEM_MAX_LENGTH,
    description: 'A system that holds the data',
  })
  system!: string;
}

export class UpdateTaskDto {
  @ApiProperty({ enum: TASK_OUTCOMES })
  outcome!: string;

  @ApiPropertyOptional({ description: 'Required when the outcome is kept_by_law' })
  reason?: string;
}

export class CloseRequestDto {
  @ApiProperty({ description: 'The reply to the person. It is recorded, not sent.' })
  replyNote!: string;
}

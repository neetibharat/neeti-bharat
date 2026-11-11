import { ApiProperty } from '@nestjs/swagger';
import {
  PROOF_DESCRIPTION_MAX_LENGTH,
  PROOF_PAGE_SIZE,
  PROOF_TABS,
  PROOF_FREQUENCIES,
  PROOF_TITLE_MAX_LENGTH,
} from '@dpdp-kit/shared';
import { z } from 'zod';
import { dayString } from './day-string';

export const saveProofRequirementSchema = z.object({
  title: z.string().trim().min(1).max(PROOF_TITLE_MAX_LENGTH),
  description: z.string().trim().max(PROOF_DESCRIPTION_MAX_LENGTH),
  frequency: z.enum(PROOF_FREQUENCIES),
  assigneeId: z.string().min(1).nullable(),
  dueDate: dayString.nullable(),
});

export const listProofSchema = z.object({
  tab: z.enum(PROOF_TABS).default('all'),
  q: z.string().trim().max(100).optional(),
  assigneeId: z.string().min(1).optional(),
  ruleId: z.string().min(1).optional(),
  controlId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(PROOF_PAGE_SIZE),
});

export type ListProofInput = z.output<typeof listProofSchema>;

export type SaveProofRequirementInput = z.output<typeof saveProofRequirementSchema>;

// Swagger reads the request shape from this class; validation uses the schema above.
export class SaveProofRequirementDto {
  @ApiProperty({ maxLength: PROOF_TITLE_MAX_LENGTH })
  title!: string;

  @ApiProperty({
    maxLength: PROOF_DESCRIPTION_MAX_LENGTH,
    description: 'What to collect. May be empty.',
  })
  description!: string;

  @ApiProperty({ enum: PROOF_FREQUENCIES, description: 'How often proof has to be provided again' })
  frequency!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'A person id, or null for the control owner',
  })
  assigneeId!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '2027-03-31',
    description: 'YYYY-MM-DD, or null',
  })
  dueDate!: string | null;
}

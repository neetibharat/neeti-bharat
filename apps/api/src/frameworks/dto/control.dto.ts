import { ApiProperty } from '@nestjs/swagger';
import {
  CONTROL_DESCRIPTION_MAX_LENGTH,
  CONTROL_TITLE_MAX_LENGTH,
  JOB_ROLES,
} from '@dpdp-kit/shared';
import { z } from 'zod';
import { dayString } from './day-string';

const detailsSchema = z.object({
  title: z.string().trim().min(1).max(CONTROL_TITLE_MAX_LENGTH),
  description: z.string().trim().min(1).max(CONTROL_DESCRIPTION_MAX_LENGTH),
  assigneeId: z.string().min(1).nullable(),
  reviewDate: dayString.nullable(),
  policyIds: z.array(z.string().min(1)).max(50),
});

/** The details of an existing control, with the job accountable for it when no one person is named. */
export const saveControlSchema = detailsSchema.extend({ ownerRole: z.enum(JOB_ROLES) });

/** A new control starts with its main policy's owner, so it picks no job. */
export const createControlSchema = detailsSchema.extend({ requirementId: z.string().min(1) });

export type SaveControlInput = z.output<typeof saveControlSchema>;
export type ControlDetailsInput = z.output<typeof detailsSchema>;
export type CreateControlInput = z.output<typeof createControlSchema>;

// Swagger reads the request shapes from these classes; validation uses the schemas above.
class ControlDetailsDto {
  @ApiProperty({ maxLength: CONTROL_TITLE_MAX_LENGTH })
  title!: string;

  @ApiProperty({ maxLength: CONTROL_DESCRIPTION_MAX_LENGTH })
  description!: string;

  @ApiProperty({ nullable: true, description: 'A person’s id, or null for nobody' })
  assigneeId!: string | null;

  @ApiProperty({ nullable: true, example: '2027-03-31', description: 'YYYY-MM-DD, or null' })
  reviewDate!: string | null;

  @ApiProperty({
    type: [String],
    description: 'The policies that cover this control, primary first',
  })
  policyIds!: string[];
}

export class SaveControlDto extends ControlDetailsDto {
  @ApiProperty({ enum: JOB_ROLES, description: 'The job accountable when no one person is named' })
  ownerRole!: string;
}

/** A new control has no job of its own: it starts with its main policy’s owner. */
export class CreateControlDto extends ControlDetailsDto {
  @ApiProperty({ example: 'R6', description: 'A rule id such as R6, or ORG for organisation-wide' })
  requirementId!: string;
}

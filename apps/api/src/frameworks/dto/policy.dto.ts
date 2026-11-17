import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CHANGELOG_MAX_LENGTH,
  JOB_ROLES,
  POLICY_APPROVER_TITLE_MAX_LENGTH,
  POLICY_STATUSES,
  POLICY_SUMMARY_MAX_LENGTH,
  POLICY_TITLE_MAX_LENGTH,
} from '@dpdp-kit/shared';
import { z } from 'zod';
import { policyDocumentSchema } from '../utils/policy-document';

export const changePolicyStatusSchema = z.object({
  status: z.enum(POLICY_STATUSES),
  changelog: z.string().trim().max(CHANGELOG_MAX_LENGTH).optional(),
});

export type ChangePolicyStatusInput = z.output<typeof changePolicyStatusSchema>;

/** A version number from the address: a whole number a database integer can hold. */
export const versionSchema = z.coerce.number().int().min(1).max(1_000_000);

// The editor's own schema decides what is kept inside the outline checked here.
export const savePolicyContentSchema = z.object({ content: policyDocumentSchema });
export type SavePolicyContentInput = z.output<typeof savePolicyContentSchema>;

export const setPolicyApproverSchema = z.object({ approverId: z.string().min(1).nullable() });
export type SetPolicyApproverInput = z.output<typeof setPolicyApproverSchema>;

export const savePolicySchema = z.object({
  title: z.string().trim().min(1).max(POLICY_TITLE_MAX_LENGTH),
  summary: z.string().trim().min(1).max(POLICY_SUMMARY_MAX_LENGTH),
  ownerRole: z.enum(JOB_ROLES),
  approverTitle: z.string().trim().min(1).max(POLICY_APPROVER_TITLE_MAX_LENGTH),
});
export const createPolicySchema = savePolicySchema.extend({
  frameworkId: z.string().min(1),
  content: policyDocumentSchema.optional(),
});
export type SavePolicyInput = z.output<typeof savePolicySchema>;
export type CreatePolicyInput = z.output<typeof createPolicySchema>;

// Swagger reads the request shapes from these classes; validation uses the schemas above.
export class SavePolicyDto {
  @ApiProperty({ maxLength: POLICY_TITLE_MAX_LENGTH })
  title!: string;

  @ApiProperty({ maxLength: POLICY_SUMMARY_MAX_LENGTH, description: 'What the policy is for' })
  summary!: string;

  @ApiProperty({ enum: JOB_ROLES, description: 'The job that owns the policy' })
  ownerRole!: string;

  @ApiProperty({
    maxLength: POLICY_APPROVER_TITLE_MAX_LENGTH,
    description: 'A plain title such as General Counsel, used until a person is named',
  })
  approverTitle!: string;
}

export class CreatePolicyDto extends SavePolicyDto {
  @ApiProperty({ description: 'The framework the policy sits under' })
  frameworkId!: string;

  @ApiPropertyOptional({
    description:
      'The text to start with, as the editor’s JSON document. Left out, the policy has no text yet.',
  })
  content?: Record<string, unknown>;
}

export class ChangePolicyStatusDto {
  @ApiProperty({ enum: POLICY_STATUSES })
  status!: string;

  @ApiPropertyOptional({
    maxLength: CHANGELOG_MAX_LENGTH,
    description: 'What changed. Used when asking for approval.',
  })
  changelog?: string;
}

export class SavePolicyContentDto {
  @ApiProperty({ description: 'The policy text, as the editor’s JSON document' })
  content!: Record<string, unknown>;
}

export class SetPolicyApproverDto {
  @ApiProperty({ nullable: true, description: 'A person’s id, or null for the plain title' })
  approverId!: string | null;
}

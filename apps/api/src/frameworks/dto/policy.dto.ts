import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CHANGELOG_MAX_LENGTH, POLICY_STATUSES } from '@dpdp-kit/shared';
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

// Swagger reads the request shapes from these classes; validation uses the schemas above.
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

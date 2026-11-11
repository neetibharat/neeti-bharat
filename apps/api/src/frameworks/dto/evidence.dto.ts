import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EVIDENCE_KINDS,
  EVIDENCE_NOTE_MAX_LENGTH,
  EVIDENCE_TITLE_MAX_LENGTH,
  EVIDENCE_URL_MAX_LENGTH,
  type AddEvidenceRequest,
} from '@dpdp-kit/shared';
import { z } from 'zod';

const title = z.string().trim().min(1).max(EVIDENCE_TITLE_MAX_LENGTH);

/** A web address people can open. Anything else, such as a javascript: link, is refused. */
const webAddress = z
  .string()
  .trim()
  .max(EVIDENCE_URL_MAX_LENGTH)
  .refine((value) => {
    try {
      return ['http:', 'https:'].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  });

const forRequirement = { proofRequirementId: z.string().min(1).optional() };

export const addEvidenceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('link'), title, url: webAddress, ...forRequirement }),
  z.object({
    kind: z.literal('note'),
    title,
    note: z.string().trim().min(1).max(EVIDENCE_NOTE_MAX_LENGTH),
    ...forRequirement,
  }),
]) satisfies z.ZodType<AddEvidenceRequest>;

export type AddEvidenceInput = z.output<typeof addEvidenceSchema>;

// Swagger reads the request shape from this class; validation uses the schema above.
export class AddEvidenceDto {
  @ApiProperty({ enum: EVIDENCE_KINDS })
  kind!: string;

  @ApiProperty({ maxLength: EVIDENCE_TITLE_MAX_LENGTH })
  title!: string;

  @ApiPropertyOptional({ description: 'For a link: an http or https address' })
  url?: string;

  @ApiPropertyOptional({ description: 'For a note: the proof itself' })
  note?: string;

  @ApiPropertyOptional({
    description: 'The proof requirement this is for. Leave out for general proof.',
  })
  proofRequirementId?: string;
}

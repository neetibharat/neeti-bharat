import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
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

/** A form field left empty counts as not sent. */
const blankAsMissing = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

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

/** The text fields sent beside the file. The title defaults to the file name. */
export const addEvidenceFileSchema = z.object({
  title: blankAsMissing(title),
  proofRequirementId: blankAsMissing(z.string().min(1)),
});

export type AddEvidenceFileInput = z.output<typeof addEvidenceFileSchema>;

// Swagger reads the request shape from this class; validation uses the schema above.
export class AddEvidenceDto {
  @ApiProperty({ enum: ['link', 'note'] })
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

export class AddEvidenceFileDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'The file to attach' })
  file!: unknown;

  @ApiPropertyOptional({
    maxLength: EVIDENCE_TITLE_MAX_LENGTH,
    description: 'Defaults to the file name',
  })
  title?: string;

  @ApiPropertyOptional({
    description: 'The proof requirement this is for. Leave out for general proof.',
  })
  proofRequirementId?: string;
}

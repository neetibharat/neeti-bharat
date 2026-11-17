import { ApiProperty } from '@nestjs/swagger';
import { AI_KEY_MAX_LENGTH, AI_MODEL_MAX_LENGTH, AI_PROVIDERS } from '@dpdp-kit/shared';
import { z } from 'zod';

export const saveAiSettingsSchema = z.object({
  provider: z.enum(AI_PROVIDERS),
  // A model name is letters, digits and a few separators, never anything that could change an address.
  model: z
    .string()
    .trim()
    .min(1)
    .max(AI_MODEL_MAX_LENGTH)
    .regex(/^[\w.:-]+$/),
  apiKey: z.string().trim().min(1).max(AI_KEY_MAX_LENGTH).regex(/^\S+$/),
});

export type SaveAiSettingsInput = z.output<typeof saveAiSettingsSchema>;

// Swagger reads the request shape from this class; validation uses the schema above.
export class SaveAiSettingsDto {
  @ApiProperty({ enum: AI_PROVIDERS })
  provider!: string;

  @ApiProperty({ example: 'deepseek-flash', description: 'The model to read documents with' })
  model!: string;

  @ApiProperty({
    description: 'The company’s own key for that service. It is tried first, then kept encrypted.',
  })
  apiKey!: string;
}

export class ImportPolicyDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'A policy as a PDF, Word (.docx) or PowerPoint (.pptx) file, up to 10 MB',
  })
  file!: unknown;
}

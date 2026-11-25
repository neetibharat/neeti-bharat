import { ApiProperty } from '@nestjs/swagger';
import {
  AI_CONTEXT_MAX_LENGTH,
  AI_FEATURES,
  AI_KEY_MAX_LENGTH,
  AI_MODEL_MAX_LENGTH,
  AI_PROVIDERS,
} from '@dpdp-kit/shared';
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

export const saveAiFeaturesSchema = z.object({
  disabledFeatures: z.array(z.enum(AI_FEATURES)).max(AI_FEATURES.length),
});

export type SaveAiFeaturesInput = z.output<typeof saveAiFeaturesSchema>;

export class SaveAiFeaturesDto {
  @ApiProperty({ enum: AI_FEATURES, isArray: true, description: 'The features to switch off' })
  disabledFeatures!: string[];
}

export const tailorPolicySchema = z.object({
  context: z.string().trim().max(AI_CONTEXT_MAX_LENGTH).optional(),
});

export type TailorPolicyInput = z.output<typeof tailorPolicySchema>;

export class TailorPolicyDto {
  @ApiProperty({
    required: false,
    maxLength: AI_CONTEXT_MAX_LENGTH,
    description:
      'Anything the AI should know about the company that the profile and vendors do not say',
  })
  context?: string;
}

export class ImportPolicyDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'A policy as a PDF, Word (.docx) or PowerPoint (.pptx) file, up to 10 MB',
  })
  file!: unknown;
}

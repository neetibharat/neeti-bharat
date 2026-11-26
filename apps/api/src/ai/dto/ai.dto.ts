import { ApiProperty } from '@nestjs/swagger';
import { AI_CONTEXT_MAX_LENGTH, AI_FEATURES } from '@neeti-bharat/shared';
import { z } from 'zod';

export const saveAiFeaturesSchema = z.object({
  enabledFeatures: z.array(z.enum(AI_FEATURES)).max(AI_FEATURES.length),
});

export type SaveAiFeaturesInput = z.output<typeof saveAiFeaturesSchema>;

export class SaveAiFeaturesDto {
  @ApiProperty({
    enum: AI_FEATURES,
    isArray: true,
    description: 'The features to switch on; the rest are off',
  })
  enabledFeatures!: string[];
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

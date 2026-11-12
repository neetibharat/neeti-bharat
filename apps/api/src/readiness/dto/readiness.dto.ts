import { ApiProperty } from '@nestjs/swagger';
import { READINESS_ANSWERS, isValidReadinessAnswers } from '@dpdp-kit/shared';
import { z } from 'zod';

export const takeReadinessSchema = z.object({
  answers: z
    .record(z.string(), z.enum(READINESS_ANSWERS))
    .refine((answers) => isValidReadinessAnswers(answers)),
});

export type TakeReadinessInput = z.output<typeof takeReadinessSchema>;

// Swagger reads the request shape from this class; validation uses the schema above.
export class TakeReadinessDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string', enum: [...READINESS_ANSWERS] },
    description: 'The answer to every question, by question id',
  })
  answers!: Record<string, string>;
}

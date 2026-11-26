import { ApiProperty } from '@nestjs/swagger';
import { WEBSITE_CHECK_PAGE_SIZE, WEBSITE_URL_MAX_LENGTH } from '@neeti-bharat/shared';
import { z } from 'zod';

export const runWebsiteCheckSchema = z.object({
  url: z.string().trim().min(1).max(WEBSITE_URL_MAX_LENGTH),
});

export const listWebsiteChecksSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(WEBSITE_CHECK_PAGE_SIZE),
});

export type RunWebsiteCheckInput = z.output<typeof runWebsiteCheckSchema>;
export type ListWebsiteChecksQuery = z.output<typeof listWebsiteChecksSchema>;

// Swagger reads the request shape from this class; validation uses the schema above.
export class RunWebsiteCheckDto {
  @ApiProperty({
    example: 'https://www.example.in',
    description: 'The site to check. https is assumed.',
  })
  url!: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RISK_POINTS,
  VENDOR_CATEGORIES,
  VENDOR_DATA_KINDS,
  VENDOR_LOCATIONS,
  VENDOR_NAME_MAX_LENGTH,
  VENDOR_PAGE_SIZE,
  VENDOR_SERVICE_MAX_LENGTH,
  VENDOR_STATUSES,
  VENDOR_TABS,
  VENDOR_TREATMENTS,
  VENDOR_TREATMENT_NOTE_MAX_LENGTH,
  VENDOR_URL_MAX_LENGTH,
} from '@neeti-bharat/shared';
import { z } from 'zod';
import { dayString } from '../../frameworks/dto/day-string';

const text = (max: number) => z.string().trim().min(1).max(max);

/** A web address, http or https only. An empty box means none. */
const webUrl = z
  .string()
  .trim()
  .max(VENDOR_URL_MAX_LENGTH)
  .pipe(z.url({ protocol: /^https?$/ }));
const optionalUrl = z
  .union([z.literal(''), webUrl])
  .transform((value) => value || undefined)
  .optional();
const clearableUrl = z
  .union([z.literal(''), webUrl])
  .transform((value) => value || null)
  .nullable()
  .optional();

/** The reason for a decision. An empty box means none. */
const note = z.string().trim().max(VENDOR_TREATMENT_NOTE_MAX_LENGTH);
const optionalNote = note.transform((value) => value || undefined).optional();
const clearableNote = note
  .transform((value) => value || null)
  .nullable()
  .optional();

const dataKinds = z.array(z.enum(VENDOR_DATA_KINDS)).transform((kinds) => [...new Set(kinds)]);

/** One step on the five-point scale, 1 to 5. */
const point = z
  .number()
  .int()
  .refine((value) => (RISK_POINTS as readonly number[]).includes(value));

/** A place on the five-by-five grid. */
const rating = z.object({ likelihood: point, impact: point });

export const addVendorSchema = z.object({
  name: text(VENDOR_NAME_MAX_LENGTH),
  website: optionalUrl,
  service: text(VENDOR_SERVICE_MAX_LENGTH),
  category: z.enum(VENDOR_CATEGORIES),
  status: z.enum(VENDOR_STATUSES).default('not_assessed'),
  dataKinds: dataKinds.default([]),
  location: z.enum(VENDOR_LOCATIONS).optional(),
  agreementUrl: optionalUrl,
  nextReviewOn: dayString.optional(),
  ownerId: z.string().min(1).optional(),
  inherent: rating.optional(),
  residual: rating.optional(),
  treatment: z.enum(VENDOR_TREATMENTS).optional(),
  treatmentNote: optionalNote,
});

export const updateVendorSchema = z.object({
  name: text(VENDOR_NAME_MAX_LENGTH).optional(),
  website: clearableUrl,
  service: text(VENDOR_SERVICE_MAX_LENGTH).optional(),
  category: z.enum(VENDOR_CATEGORIES).optional(),
  status: z.enum(VENDOR_STATUSES).optional(),
  dataKinds: dataKinds.optional(),
  location: z.enum(VENDOR_LOCATIONS).nullable().optional(),
  agreementUrl: clearableUrl,
  nextReviewOn: dayString.nullable().optional(),
  ownerId: z.string().min(1).nullable().optional(),
  inherent: rating.nullable().optional(),
  residual: rating.nullable().optional(),
  treatment: z.enum(VENDOR_TREATMENTS).nullable().optional(),
  treatmentNote: clearableNote,
});

export const listVendorsSchema = z.object({
  tab: z.enum(VENDOR_TABS).default('active'),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(VENDOR_PAGE_SIZE),
});

export const pageSchema = listVendorsSchema.pick({ page: true, limit: true });
export type PageQuery = z.output<typeof pageSchema>;

export type AddVendorInput = z.output<typeof addVendorSchema>;
export type UpdateVendorInput = z.output<typeof updateVendorSchema>;
export type ListVendorsQuery = z.output<typeof listVendorsSchema>;

class RatingDto {
  @ApiProperty({ enum: RISK_POINTS, description: '1 (very unlikely) to 5 (very likely)' })
  likelihood!: number;

  @ApiProperty({ enum: RISK_POINTS, description: '1 (insignificant) to 5 (severe)' })
  impact!: number;
}

// Swagger reads the request shapes from these classes; validation uses the schemas above.
export class AddVendorDto {
  @ApiProperty({ example: 'Acme Payroll' })
  name!: string;

  @ApiPropertyOptional({ example: 'https://acme.example.com' })
  website?: string;

  @ApiProperty({ example: 'Runs our monthly payroll' })
  service!: string;

  @ApiProperty({ enum: VENDOR_CATEGORIES })
  category!: string;

  @ApiPropertyOptional({ enum: VENDOR_STATUSES, description: 'not_assessed when not sent' })
  status?: string;

  @ApiPropertyOptional({
    enum: VENDOR_DATA_KINDS,
    isArray: true,
    description: 'The data it is given',
  })
  dataKinds?: string[];

  @ApiPropertyOptional({ enum: VENDOR_LOCATIONS, description: 'Where it keeps the data' })
  location?: string;

  @ApiPropertyOptional({ description: 'A link to the agreement in the company’s own storage' })
  agreementUrl?: string;

  @ApiPropertyOptional({ example: '2027-03-31', description: 'YYYY-MM-DD' })
  nextReviewOn?: string;

  @ApiPropertyOptional({ description: 'The person who answers for the vendor' })
  ownerId?: string;

  @ApiPropertyOptional({
    type: RatingDto,
    description: 'The risk before anything is done about it',
  })
  inherent?: RatingDto;

  @ApiPropertyOptional({
    type: RatingDto,
    description: 'The risk after the company’s own measures',
  })
  residual?: RatingDto;

  @ApiPropertyOptional({ enum: VENDOR_TREATMENTS, description: 'What to do about the risk' })
  treatment?: string;

  @ApiPropertyOptional({ description: 'Why that is the right decision' })
  treatmentNote?: string;
}

export class UpdateVendorDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  website?: string | null;

  @ApiPropertyOptional()
  service?: string;

  @ApiPropertyOptional({ enum: VENDOR_CATEGORIES })
  category?: string;

  @ApiPropertyOptional({ enum: VENDOR_STATUSES })
  status?: string;

  @ApiPropertyOptional({ enum: VENDOR_DATA_KINDS, isArray: true })
  dataKinds?: string[];

  @ApiPropertyOptional({ enum: VENDOR_LOCATIONS, nullable: true })
  location?: string | null;

  @ApiPropertyOptional({ nullable: true })
  agreementUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  nextReviewOn?: string | null;

  @ApiPropertyOptional({ nullable: true })
  ownerId?: string | null;

  @ApiPropertyOptional({ type: RatingDto, nullable: true })
  inherent?: RatingDto | null;

  @ApiPropertyOptional({ type: RatingDto, nullable: true })
  residual?: RatingDto | null;

  @ApiPropertyOptional({ enum: VENDOR_TREATMENTS, nullable: true })
  treatment?: string | null;

  @ApiPropertyOptional({ nullable: true })
  treatmentNote?: string | null;
}

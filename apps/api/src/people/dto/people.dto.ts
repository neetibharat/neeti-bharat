import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { APP_ROLES, JOB_ROLES, PEOPLE_PAGE_SIZE } from '@dpdp-kit/shared';
import { z } from 'zod';

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = z
  .string()
  .trim()
  .max(120)
  .transform((value) => value || undefined)
  .optional();

export const addPersonSchema = z.object({
  name: text(120),
  email: z.email().transform((email) => email.toLowerCase()),
  department: optionalText,
  jobTitle: optionalText,
  access: z.enum(APP_ROLES),
});

export const updatePersonSchema = z.object({
  name: text(120).optional(),
  department: z.string().trim().max(120).nullable().optional(),
  jobTitle: z.string().trim().max(120).nullable().optional(),
});

export const listPeopleSchema = z.object({
  status: z.enum(['active', 'left']).default('active'),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(PEOPLE_PAGE_SIZE),
});

export type ListPeopleQuery = z.output<typeof listPeopleSchema>;

export const setAccessSchema = z.object({ access: z.enum(APP_ROLES) });

export const assignRoleSchema = z.object({ personId: z.string().min(1).nullable() });

export const jobRoleSchema = z.enum(JOB_ROLES);

export type AddPersonInput = z.output<typeof addPersonSchema>;
export type UpdatePersonInput = z.output<typeof updatePersonSchema>;
export type SetAccessInput = z.output<typeof setAccessSchema>;
export type AssignRoleInput = z.output<typeof assignRoleSchema>;

// Swagger reads the request shapes from these classes; validation uses the schemas above.
export class AddPersonDto {
  @ApiProperty({ example: 'Priya Sharma' })
  name!: string;

  @ApiProperty({ example: 'priya@company.in' })
  email!: string;

  @ApiPropertyOptional()
  department?: string;

  @ApiPropertyOptional()
  jobTitle?: string;

  @ApiProperty({ enum: APP_ROLES, description: 'The role they are invited with' })
  access!: string;
}

export class UpdatePersonDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  department?: string | null;

  @ApiPropertyOptional({ nullable: true })
  jobTitle?: string | null;
}

export class SetAccessDto {
  @ApiProperty({ enum: APP_ROLES })
  access!: string;
}

export class AssignRoleDto {
  @ApiProperty({
    nullable: true,
    description: 'The person to hold the role, or null to leave it vacant',
  })
  personId!: string | null;
}

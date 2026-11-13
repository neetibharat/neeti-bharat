import { ApiProperty } from '@nestjs/swagger';
import { APP_ROLES, NOTIFICATION_KINDS, NOTIFICATION_PAGE_SIZE } from '@dpdp-kit/shared';
import { z } from 'zod';

export const listNotificationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(NOTIFICATION_PAGE_SIZE),
  unread: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export const updatePreferencesSchema = z.object({
  items: z
    .array(z.object({ kind: z.enum(NOTIFICATION_KINDS), inApp: z.boolean(), email: z.boolean() }))
    .min(1)
    .max(NOTIFICATION_KINDS.length)
    .refine((items) => new Set(items.map((item) => item.kind)).size === items.length),
});

export const updateRoleDefaultsSchema = z.object({
  items: z
    .array(
      z.object({
        role: z.enum(APP_ROLES),
        kind: z.enum(NOTIFICATION_KINDS),
        inApp: z.boolean(),
        email: z.boolean(),
      }),
    )
    .min(1)
    .max(APP_ROLES.length * NOTIFICATION_KINDS.length)
    .refine((items) => new Set(items.map((i) => `${i.role}:${i.kind}`)).size === items.length),
});

export type UpdateRoleDefaultsInput = z.output<typeof updateRoleDefaultsSchema>;
export type ListNotificationsQuery = z.output<typeof listNotificationsSchema>;
export type UpdatePreferencesInput = z.output<typeof updatePreferencesSchema>;

export class PreferenceDto {
  @ApiProperty({ enum: NOTIFICATION_KINDS })
  kind!: string;

  @ApiProperty({ description: 'Whether notices of this kind are kept in the inbox.' })
  inApp!: boolean;

  @ApiProperty({ description: 'Whether notices of this kind are also emailed.' })
  email!: boolean;
}

export class UpdatePreferencesDto {
  @ApiProperty({ type: [PreferenceDto], description: 'One entry for each kind to change.' })
  items!: PreferenceDto[];
}

export class RoleDefaultDto extends PreferenceDto {
  @ApiProperty({ enum: APP_ROLES })
  role!: string;
}

export class UpdateRoleDefaultsDto {
  @ApiProperty({
    type: [RoleDefaultDto],
    description: 'One entry for each role and kind to change.',
  })
  items!: RoleDefaultDto[];
}

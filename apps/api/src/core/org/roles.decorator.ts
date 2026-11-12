import { SetMetadata } from '@nestjs/common';
import type { AppRole } from '@dpdp-kit/shared';

export const ROLES_KEY = 'organization:roles';
export const NO_ORGANIZATION_KEY = 'organization:none';
export const NO_API_KEY_KEY = 'organization:no-api-key';

/**
 * Who may call a route: people whose role in the organisation they are working in is one of these.
 * It replaces the library's decorator of the same name, which reads one role off the account.
 */
export const Roles = (roles: readonly AppRole[]) => SetMetadata(ROLES_KEY, roles);

/** For a route that is not about one organisation, such as listing the ones a person can open. */
export const NoOrganization = () => SetMetadata(NO_ORGANIZATION_KEY, true);

/** For routes a person must use themselves, such as making API keys: a request signed in with a key is refused. */
export const NoApiKey = () => SetMetadata(NO_API_KEY_KEY, true);

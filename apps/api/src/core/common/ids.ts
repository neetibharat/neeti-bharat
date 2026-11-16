import { randomUUID } from 'node:crypto';
import { CUSTOM_ID_PREFIX } from '@dpdp-kit/shared';

/** The id of something a company adds. The prefix keeps it apart from the catalogue codes, such as R6 or P05. */
export const newCustomId = (): string => `${CUSTOM_ID_PREFIX}${randomUUID()}`;

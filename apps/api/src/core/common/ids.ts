import { randomUUID } from 'node:crypto';

/** The id of something a company adds. The prefix keeps it apart from the catalogue codes, such as R6 or P05. */
export const newCustomId = (): string => `custom-${randomUUID()}`;

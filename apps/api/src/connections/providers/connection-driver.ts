import type { ConnectionCheckResult, GithubSelection } from '@dpdp-kit/shared';

/** What a connection signs in with, as the person entered it. Which fields there are depends on the system. */
export type Credentials = Record<string, string>;

/** The part of a connection that is not secret, kept in the clear so the list can say what it reads. */
export type Identifiers = Record<string, string>;

/**
 * What the service needs of a system it can check: to try the details, and to read the system. One for each provider, so
 * the service does not need to know what an Azure subscription or a GitHub App is.
 */
export interface ConnectionDriver {
  /**
   * Signs in with the details to see that they work, and gives back what to keep in the clear. Throws that system's own
   * sign-in and access errors when they do not work. `selection` is the repositories to read, for GitHub.
   */
  verify(credentials: Credentials, selection?: GithubSelection): Promise<Identifiers>;
  /** Reads the system and judges it. `identifiers` are what `verify` gave back. */
  check(credentials: Credentials, identifiers: Identifiers): Promise<ConnectionCheckResult[]>;
}

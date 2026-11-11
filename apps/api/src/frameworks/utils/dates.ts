/** A moment as an ISO string, or null when there is none. */
export const iso = (date: Date | null): string | null => (date ? date.toISOString() : null);

/** The calendar day of a moment as YYYY-MM-DD, in UTC. */
export const day = (date: Date | null): string | null => (date ? iso(date)!.slice(0, 10) : null);

/** A YYYY-MM-DD date as the moment that day starts, in UTC. */
export const dayToDate = (value: string | null): Date | null =>
  value ? new Date(`${value}T00:00:00.000Z`) : null;

/** When proof was last given, from a list of proof with the newest first, or null if never. */
export const lastProvided = (evidence: { createdAt: Date }[]): Date | null =>
  evidence[0]?.createdAt ?? null;

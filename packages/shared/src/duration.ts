const UNIT_MS = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
  // A month is 30 days and a year 365: the profile allows both, and a deadline needs one fixed length.
  month: 2_592_000_000,
  year: 31_536_000_000,
} as const;

const DURATION = /^\s*(\d+)\s*(minute|hour|day|week|month|year)s?\s*$/i;

/** A length of time such as "72 hours" or "2 weeks" in milliseconds, or null when the text is not one. */
export function parseDuration(text: string): number | null {
  const match = DURATION.exec(text);
  if (!match) return null;
  const count = Number(match[1]);
  const unit = match[2]!.toLowerCase() as keyof typeof UNIT_MS;
  return count > 0 ? count * UNIT_MS[unit] : null;
}

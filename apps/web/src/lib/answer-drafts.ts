import { isValidProfileValue, type ProfileEntryResponse } from '@neeti-bharat/shared';

/** Answers being typed, by key, before they are saved. */
export type Drafts = Record<string, string>;

/** The saved value of each of these answers, to start the form from. A missing answer starts empty. */
export function draftsFrom(
  entries: readonly ProfileEntryResponse[],
  keys: readonly string[],
): Drafts {
  return Object.fromEntries(
    keys.map((key) => [key, entries.find((entry) => entry.key === key)?.value ?? '']),
  );
}

/** Fills in an answer that has nothing yet, for example the company name from the organisation's own. */
export function withFallbacks(drafts: Drafts, fallbacks: Drafts): Drafts {
  return Object.fromEntries(
    Object.entries(drafts).map(([key, value]) => [key, value || fallbacks[key] || '']),
  );
}

/** The answers that differ from what is saved: only those need sending. */
export function changedAnswers(drafts: Drafts, entries: readonly ProfileEntryResponse[]): Drafts {
  return Object.fromEntries(
    Object.entries(drafts).filter(
      ([key, value]) => value !== (entries.find((entry) => entry.key === key)?.value ?? ''),
    ),
  );
}

/** The keys whose draft the API would refuse, such as an email without an @. */
export function invalidAnswers(drafts: Drafts, entries: readonly ProfileEntryResponse[]): string[] {
  return Object.entries(drafts)
    .filter(([key, value]) => {
      const entry = entries.find((candidate) => candidate.key === key);
      return entry ? !isValidProfileValue(entry.kind, value.trim()) : false;
    })
    .map(([key]) => key);
}

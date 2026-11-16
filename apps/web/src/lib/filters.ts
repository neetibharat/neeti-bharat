/** The filter value that means "no limit". */
export const ALL = 'all';

/** Whether any field contains the search, ignoring case and outer spaces. An empty search matches everything. */
export function matchesSearch(
  fields: ReadonlyArray<string | null | undefined>,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => field?.toLowerCase().includes(needle));
}

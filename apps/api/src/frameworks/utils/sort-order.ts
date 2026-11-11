/** Where a new row goes: one after the highest `sortOrder` the caller's aggregate found. */
export async function nextSortOrder(
  highest: () => Promise<{ _max: { sortOrder: number | null } }>,
): Promise<number> {
  return ((await highest())._max.sortOrder ?? 0) + 1;
}

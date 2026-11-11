/** The same values with every text field trimmed. Other fields are left as they are. */
export function trimStrings<T extends object>(values: T): T {
  const trimmed = Object.entries(values)
    .filter(([, value]) => typeof value === 'string')
    .map(([key, value]) => [key, value.trim()]);
  return { ...values, ...Object.fromEntries(trimmed) };
}

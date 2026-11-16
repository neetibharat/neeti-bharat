/** A path segment decoded, or null when it is not valid percent-encoding. */
export function decodeParam(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

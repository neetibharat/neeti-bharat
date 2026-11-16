/** The file name the API asked for in `Content-Disposition`, or the fallback when it did not say. */
export function fileNameFromDisposition(header: string | null, fallback: string): string {
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header ?? '')?.[1];
  if (!encoded) return fallback;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return fallback;
  }
}

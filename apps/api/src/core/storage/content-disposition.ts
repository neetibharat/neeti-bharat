/** RFC 5987 encoding, so any file name survives in a header; `encodeURIComponent` alone leaves `'()*` unescaped. */
export function attachmentDisposition(fileName: string): string {
  const encoded = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename*=UTF-8''${encoded}`;
}

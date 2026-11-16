const UNSAFE = /[\\/:*?"<>|]+/g;
const SPACE = 32;

const withoutControlCharacters = (text: string): string =>
  [...text].filter((char) => char.charCodeAt(0) >= SPACE).join('');

/** One safe file name for inside the zip: no folders, no characters a system refuses, never empty. */
export function safeName(name: string, fallback = 'file'): string {
  const cleaned = withoutControlCharacters(name).replace(UNSAFE, '_').replace(/^\.+/, '').trim();
  return cleaned.slice(0, 120) || fallback;
}

/** Today as YYYY-MM-DD, for the end of a download's name. */
export function dayStamp(now: Date): string {
  return now.toISOString().slice(0, 10);
}

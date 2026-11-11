const UNITS = ['B', 'KB', 'MB', 'GB'];

/** A size in bytes for people: 191 B, 1.5 KB, 25 MB. One decimal at most, and none when it would be .0. */
export function formatFileSize(bytes: number): string {
  let value = Math.max(0, bytes);
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = unit === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${UNITS[unit]}`;
}

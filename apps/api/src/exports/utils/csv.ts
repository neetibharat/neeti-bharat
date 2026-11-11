export type Cell = string | number | boolean | null | undefined;

// A cell that starts with one of these is read by Excel as a formula, so it is made plain text.
const FORMULA_START = /^[=+\-@\t\r]/;
const NEEDS_QUOTES = /[",\r\n]/;
// Tells Excel the file is UTF-8, so names with accents and Indian scripts read correctly.
const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

function cellText(cell: Cell): string {
  if (cell === null || cell === undefined) return '';
  if (typeof cell !== 'string') return String(cell);
  return FORMULA_START.test(cell) ? `'${cell}` : cell;
}

function escape(cell: Cell): string {
  const text = cellText(cell);
  return NEEDS_QUOTES.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** A CSV that opens correctly in Excel: a byte order mark, CRLF line ends, and no cell that runs as a formula. */
export function toCsv(header: readonly string[], rows: readonly (readonly Cell[])[]): string {
  const lines = [header, ...rows].map((row) => row.map(escape).join(','));
  return `${BYTE_ORDER_MARK}${lines.join('\r\n')}\r\n`;
}

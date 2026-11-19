export interface TextPart {
  text: string;
  /** Set for a web address, which can be opened. */
  href?: string;
}

const WEB_ADDRESS = /https?:\/\/[^\s<>"']+/gi;
/** Punctuation that ends a sentence rather than an address, such as the dot in "see https://x.in/a." */
const TRAILING = /[.,;:!?)\]}]+$/;

/** Splits text into plain parts and web addresses, so the addresses can be shown as links. Only http and https count. */
export function splitLinks(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(WEB_ADDRESS)) {
    const address = match[0].replace(TRAILING, '');
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    parts.push({ text: address, href: address });
    last = match.index + address.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

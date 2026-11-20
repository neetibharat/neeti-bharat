export interface TextPart {
  text: string;
  /** Set for a web address or a template file, which can be opened. */
  href?: string;
  /** Set for a template file kept with the app: it is downloaded, not opened in a new tab. */
  isFile?: boolean;
}

/** A web address, or a template file the app serves from `/templates/`. */
const LINK = /https?:\/\/[^\s<>"']+|(?<![\w/.:-])\/templates\/[^\s<>"']+/gi;
/** Punctuation that ends a sentence rather than an address, such as the dot in "see https://x.in/a." */
const TRAILING = /[.,;:!?)\]}]+$/;

const fileName = (path: string): string => path.slice(path.lastIndexOf('/') + 1);

/**
 * Splits text into plain parts and links, so the links can be shown as links. A web address must be http or https. A
 * path under `/templates/` is a template file served by the app, shown by its file name.
 */
export function splitLinks(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const address = match[0].replace(TRAILING, '');
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    const isFile = address.startsWith('/');
    parts.push(
      isFile
        ? { text: fileName(address), href: address, isFile }
        : { text: address, href: address },
    );
    last = match.index + address.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

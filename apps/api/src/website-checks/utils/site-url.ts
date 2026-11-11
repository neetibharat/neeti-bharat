const ALLOWED_PORTS = new Set(['', '80', '443']);

/**
 * The address a person typed, as a URL we are willing to visit, or null. https is assumed when no scheme is given.
 * Only http and https on their usual ports, with no login in the address.
 */
export function parseSiteUrl(input: string): URL | null {
  const text = input.trim();
  if (!text) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`);
    return isVisitable(url) ? url : null;
  } catch {
    return null;
  }
}

const isVisitable = (url: URL): boolean =>
  ['https:', 'http:'].includes(url.protocol) &&
  ALLOWED_PORTS.has(url.port) &&
  !url.username &&
  !url.password &&
  url.hostname.includes('.');

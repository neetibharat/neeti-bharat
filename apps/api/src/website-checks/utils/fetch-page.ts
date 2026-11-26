import { lookup as dnsLookup, type LookupAddress } from 'node:dns';
import { request as httpRequest, type IncomingHttpHeaders, type IncomingMessage } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import type { TLSSocket } from 'node:tls';
import type { UnreachableReason } from '@neeti-bharat/shared';
import { isPublicAddress } from './public-address';
import { parseSiteUrl } from './site-url';

/** A page that could not be read, and the reason in a word the report can show. */
export class FetchFailure extends Error {
  constructor(readonly reason: UnreachableReason) {
    super(reason);
  }
}

export interface PageResponse {
  /** Where the page finally was, after any redirects. */
  url: URL;
  status: number;
  headers: IncomingHttpHeaders;
  /** The start of the page, as text, no longer than `maxBytes`. */
  body: string;
  /** Only for a page read over https. */
  tls?: { protocol: string | null; validTo: Date | null };
}

export interface FetchOptions {
  /** One deadline for the whole page, redirects included. */
  timeoutMs: number;
  maxBytes: number;
  maxRedirects: number;
  /** Which addresses may be connected to. Only tests change this. */
  isAllowedAddress?: (address: string) => boolean;
  /** Which addresses a redirect may lead to. Only tests change this. */
  isAllowedUrl?: (url: URL) => boolean;
}

const USER_AGENT = 'Neeti-Bharat-WebsiteCheck/1 (+compliance self-check)';

const CERTIFICATE_ERRORS = new Set([
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'CERT_HAS_EXPIRED',
  'CERT_NOT_YET_VALID',
  'ERR_TLS_CERT_ALTNAME_INVALID',
]);

function reasonOf(error: unknown): UnreachableReason {
  if (error instanceof FetchFailure) return error.reason;
  const code = (error as { code?: string }).code ?? '';
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') return 'dns';
  if (code === 'ECONNREFUSED') return 'refused';
  if (code === 'ETIMEDOUT') return 'timeout';
  return CERTIFICATE_ERRORS.has(code) ? 'certificate' : 'other';
}

/** A DNS lookup that refuses the name if any address it points to is not on the public internet. */
function guardedLookup(isAllowed: (address: string) => boolean) {
  return (
    hostname: string,
    options: { all?: boolean },
    done: (error: Error | null, address?: string | LookupAddress[], family?: number) => void,
  ): void => {
    dnsLookup(hostname, { all: true }, (error, addresses) => {
      if (error) return done(error);
      if (!addresses.length || !addresses.every((entry) => isAllowed(entry.address))) {
        return done(new FetchFailure('not_allowed'));
      }
      if (options.all) return done(null, addresses);
      return done(null, addresses[0]!.address, addresses[0]!.family);
    });
  };
}

function readBody(response: IncomingMessage, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const finish = () => resolve(Buffer.concat(chunks).subarray(0, maxBytes).toString('utf8'));
    response.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
      size += chunk.length;
      if (size >= maxBytes) {
        response.destroy();
        finish();
      }
    });
    response.on('end', finish);
    response.on('error', reject);
  });
}

function tlsOf(response: IncomingMessage): PageResponse['tls'] {
  const socket = response.socket as Partial<TLSSocket>;
  if (typeof socket.getProtocol !== 'function') return undefined;
  const validTo = socket.getPeerCertificate?.().valid_to;
  return { protocol: socket.getProtocol(), validTo: validTo ? new Date(validTo) : null };
}

interface Hop {
  response: IncomingMessage;
  url: URL;
}

function getOnce(url: URL, options: FetchOptions, signal: AbortSignal): Promise<Hop> {
  const send = url.protocol === 'https:' ? httpsRequest : httpRequest;
  const isAllowed = options.isAllowedAddress ?? isPublicAddress;
  return new Promise((resolve, reject) => {
    if (
      isIP(url.hostname.replace(/^\[|\]$/g, '')) &&
      !isAllowed(url.hostname.replace(/^\[|\]$/g, ''))
    ) {
      return reject(new FetchFailure('not_allowed'));
    }
    const req = send(
      url,
      {
        method: 'GET',
        signal,
        lookup: guardedLookup(isAllowed) as never,
        headers: {
          'user-agent': USER_AGENT,
          accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
        },
      },
      (response) => resolve({ response, url }),
    );
    req.on('error', reject);
    req.end();
  });
}

/** Where a redirect leads, or null when the answer is not a redirect. */
function redirectTarget({ response, url }: Hop, options: FetchOptions): URL | null {
  const status = response.statusCode ?? 0;
  const location = response.headers.location;
  if (status < 300 || status >= 400 || !location) return null;
  response.resume();
  const next = new URL(location, url);
  const isAllowedUrl =
    options.isAllowedUrl ?? ((target: URL) => parseSiteUrl(target.href) !== null);
  if (!isAllowedUrl(next)) throw new FetchFailure('not_allowed');
  return next;
}

async function follow(start: URL, options: FetchOptions, signal: AbortSignal): Promise<Hop> {
  let url = start;
  for (let redirects = 0; ; redirects += 1) {
    const hop = await getOnce(url, options, signal);
    const next = redirectTarget(hop, options);
    if (!next) return hop;
    if (redirects >= options.maxRedirects) throw new FetchFailure('too_many_redirects');
    url = next;
  }
}

/**
 * Reads one page the way a visitor's browser would, for the website check. It follows redirects (each one is checked
 * again), refuses any address that is not public, and stops at a deadline and a size limit, so a person-supplied
 * address cannot be used to reach anything inside the network or to tie the server up.
 */
export async function fetchPage(start: URL, options: FetchOptions): Promise<PageResponse> {
  const signal = AbortSignal.timeout(options.timeoutMs);
  try {
    const { response, url } = await follow(start, options, signal);
    // The connection is let go once the body has been read, so the certificate is read first.
    const tls = tlsOf(response);
    const body = await readBody(response, options.maxBytes);
    return { url, status: response.statusCode ?? 0, headers: response.headers, body, tls };
  } catch (error) {
    if (signal.aborted) throw new FetchFailure('timeout');
    throw new FetchFailure(reasonOf(error));
  }
}

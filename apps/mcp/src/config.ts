export interface Config {
  /** The API address without a trailing slash or `/v1`. */
  apiUrl: string;
  apiKey: string;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/** Reads the address and key Claude's settings pass in. The key only ever goes to this address. */
export function readConfig(env: NodeJS.ProcessEnv): Config {
  const apiKey = env['DPDP_API_KEY']?.trim();
  const rawUrl = env['DPDP_API_URL']?.trim();
  if (!rawUrl)
    throw new Error('DPDP_API_URL is not set. Set it to the address of your DPDP Kit API.');
  if (!apiKey)
    throw new Error('DPDP_API_KEY is not set. Make a key under Settings, API keys, in DPDP Kit.');

  const url = parseUrl(rawUrl);
  // A key sent over plain http can be read on the way, so only a machine's own address may use it.
  if (url.protocol !== 'https:' && !LOCAL_HOSTS.has(url.hostname)) {
    throw new Error('DPDP_API_URL must start with https:// so the key is not sent in the clear.');
  }
  return {
    apiUrl: `${url.origin}${url.pathname}`.replace(/\/+$/, '').replace(/\/v1$/, ''),
    apiKey,
  };
}

function parseUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    throw new Error(`DPDP_API_URL is not a web address: ${value}`);
  }
}

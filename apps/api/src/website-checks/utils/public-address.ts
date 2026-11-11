import { isIP } from 'node:net';

type Octets = readonly [number, number, number];

// Each rule says whether an IPv4 address (as its first three numbers) is outside the public internet.
const NOT_PUBLIC_V4: readonly ((octets: Octets) => boolean)[] = [
  ([a]) => a === 0 || a === 10 || a === 127 || a >= 224,
  ([a, b]) => a === 100 && b >= 64 && b <= 127,
  ([a, b]) => a === 172 && b >= 16 && b <= 31,
  ([a, b]) => a === 169 && b === 254,
  ([a, b]) => a === 192 && b === 168,
  ([a, b, c]) => a === 192 && b === 0 && c === 0,
  ([a, b]) => a === 198 && (b === 18 || b === 19),
];

function isPublicV4(address: string): boolean {
  const [a = 0, b = 0, c = 0] = address.split('.').map(Number);
  return !NOT_PUBLIC_V4.some((rule) => rule([a, b, c]));
}

/** The IPv4 address inside an IPv4-mapped IPv6 address such as ::ffff:10.0.0.1, when it is one. */
function mappedV4(address: string): string | null {
  const dotted = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  if (dotted) return dotted[1]!;
  const hex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(address);
  if (!hex) return null;
  const high = parseInt(hex[1]!, 16);
  const low = parseInt(hex[2]!, 16);
  return `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
}

function isPublicV6(address: string): boolean {
  const lower = address.toLowerCase();
  const mapped = mappedV4(lower);
  if (mapped) return isPublicV4(mapped);
  if (lower === '::' || lower === '::1') return false;
  const first = parseInt(lower.split(':')[0] || '0', 16);
  if ((first & 0xfe00) === 0xfc00) return false;
  if ((first & 0xffc0) === 0xfe80) return false;
  return (first & 0xff00) !== 0xff00;
}

/** True only for an address on the public internet. The checker never connects to anything else. */
export function isPublicAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isPublicV4(address);
  if (version === 6) return isPublicV6(address);
  return false;
}

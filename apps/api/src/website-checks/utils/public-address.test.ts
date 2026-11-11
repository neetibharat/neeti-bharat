import { describe, expect, it } from 'vitest';
import { isPublicAddress } from './public-address';

describe('isPublicAddress', () => {
  it.each([
    '8.8.8.8',
    '1.1.1.1',
    '93.184.216.34',
    '172.15.0.1',
    '172.32.0.1',
    '2606:4700:4700::1111',
  ])('allows %s', (address) => expect(isPublicAddress(address)).toBe(true));

  it.each([
    '0.0.0.0',
    '10.1.2.3',
    '127.0.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '100.64.0.1',
    '198.18.0.1',
    '224.0.0.1',
    '255.255.255.255',
  ])('refuses the private or reserved IPv4 address %s', (address) =>
    expect(isPublicAddress(address)).toBe(false),
  );

  it.each(['::', '::1', 'fc00::1', 'fd12:3456::1', 'fe80::1', 'ff02::1'])(
    'refuses the private IPv6 address %s',
    (address) => expect(isPublicAddress(address)).toBe(false),
  );

  it('looks inside an IPv4-mapped IPv6 address', () => {
    expect(isPublicAddress('::ffff:10.0.0.1')).toBe(false);
    expect(isPublicAddress('::ffff:7f00:1')).toBe(false);
    expect(isPublicAddress('::ffff:8.8.8.8')).toBe(true);
  });

  it('refuses anything that is not an address', () => {
    expect(isPublicAddress('example.com')).toBe(false);
    expect(isPublicAddress('')).toBe(false);
  });
});

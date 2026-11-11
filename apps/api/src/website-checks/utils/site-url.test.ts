import { describe, expect, it } from 'vitest';
import { parseSiteUrl } from './site-url';

describe('parseSiteUrl', () => {
  it('assumes https when there is no scheme', () => {
    expect(parseSiteUrl('example.com')?.href).toBe('https://example.com/');
    expect(parseSiteUrl('  www.example.in/privacy ')?.href).toBe('https://www.example.in/privacy');
  });

  it('keeps http and https addresses', () => {
    expect(parseSiteUrl('http://example.com')?.protocol).toBe('http:');
    expect(parseSiteUrl('https://example.com:443/')?.protocol).toBe('https:');
  });

  it.each([
    '',
    '   ',
    'ftp://example.com',
    'file:///etc/passwd',
    'javascript:alert(1)',
    'https://user:pass@example.com',
    'https://example.com:8080',
    'https://localhost',
    'http://',
  ])('refuses %j', (input) => expect(parseSiteUrl(input)).toBeNull());
});

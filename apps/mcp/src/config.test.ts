import { describe, expect, it } from 'vitest';
import { readConfig } from './config.js';

const env = (values: Record<string, string>) => values as NodeJS.ProcessEnv;

describe('readConfig', () => {
  it('reads the address and key, without a trailing slash or /v1', () => {
    const config = readConfig(
      env({ APP_API_URL: 'https://api.example.com/v1/', APP_API_KEY: ' k ' }),
    );
    expect(config).toEqual({ apiUrl: 'https://api.example.com', apiKey: 'k' });
  });

  it('needs both values and says which is missing', () => {
    expect(() => readConfig(env({ APP_API_KEY: 'k' }))).toThrow('APP_API_URL');
    expect(() => readConfig(env({ APP_API_URL: 'https://a.example.com' }))).toThrow('APP_API_KEY');
  });

  it('refuses to send the key over plain http, except to this machine', () => {
    expect(() =>
      readConfig(env({ APP_API_URL: 'http://api.example.com', APP_API_KEY: 'k' })),
    ).toThrow('https');
    expect(readConfig(env({ APP_API_URL: 'http://localhost:3211', APP_API_KEY: 'k' })).apiUrl).toBe(
      'http://localhost:3211',
    );
  });

  it('rejects an address that is not one', () => {
    expect(() => readConfig(env({ APP_API_URL: 'not a url', APP_API_KEY: 'k' }))).toThrow(
      'web address',
    );
  });

  it('still reads the older DPDP_ names, and prefers the APP_ ones when both are set', () => {
    expect(readConfig(env({ DPDP_API_URL: 'https://old.example.com', DPDP_API_KEY: 'o' }))).toEqual(
      { apiUrl: 'https://old.example.com', apiKey: 'o' },
    );
    expect(
      readConfig(
        env({
          APP_API_URL: 'https://new.example.com',
          APP_API_KEY: 'n',
          DPDP_API_URL: 'https://old.example.com',
          DPDP_API_KEY: 'o',
        }),
      ),
    ).toEqual({ apiUrl: 'https://new.example.com', apiKey: 'n' });
  });
});

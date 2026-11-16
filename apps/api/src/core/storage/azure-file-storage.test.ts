import { describe, expect, it } from 'vitest';
import { AzureBlobFileStorage } from './azure-file-storage';

// A made-up key: the link is signed on this machine and nothing is sent anywhere.
const storage = new AzureBlobFileStorage({
  account: 'devaccount',
  accountKey: Buffer.from('not-a-real-key-just-test-bytes').toString('base64'),
  container: 'proof',
});

describe('AzureBlobFileStorage', () => {
  it('signs a read-only link that expires, saves under the original name and keeps the type', async () => {
    const before = Date.now();
    const url = new URL(
      await storage.signedDownloadUrl('evidence/c1/u1/Scan report.pdf', {
        fileName: 'Scan report.pdf',
        contentType: 'application/pdf',
        expiresInSeconds: 300,
      }),
    );
    expect(url.origin).toBe('https://devaccount.blob.core.windows.net');
    expect(url.pathname).toBe('/proof/evidence/c1/u1/Scan%20report.pdf');
    expect(url.searchParams.get('sp')).toBe('r');
    expect(url.searchParams.get('sig')).toBeTruthy();
    const expires = new Date(url.searchParams.get('se')!).getTime();
    expect(expires - before).toBeGreaterThan(290_000);
    expect(expires - before).toBeLessThan(310_000);
    expect(url.searchParams.get('rscd')).toBe("attachment; filename*=UTF-8''Scan%20report.pdf");
    expect(url.searchParams.get('rsct')).toBe('application/pdf');
  });

  it('uses the endpoint given, for the Azurite emulator', async () => {
    const local = new AzureBlobFileStorage({
      account: 'devstoreaccount1',
      accountKey: Buffer.from('x').toString('base64'),
      container: 'proof',
      endpoint: 'http://127.0.0.1:10000/devstoreaccount1',
    });
    const url = await local.signedDownloadUrl('a.pdf', {
      fileName: 'a.pdf',
      contentType: 'application/pdf',
      expiresInSeconds: 60,
    });
    expect(url.startsWith('http://127.0.0.1:10000/devstoreaccount1/proof/a.pdf?')).toBe(true);
  });

  it('is enabled', () => {
    expect(storage.isEnabled()).toBe(true);
  });
});

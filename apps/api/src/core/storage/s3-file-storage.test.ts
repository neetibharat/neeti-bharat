import { describe, expect, it } from 'vitest';
import { S3FileStorage } from './s3-file-storage';

const storage = new S3FileStorage({
  bucket: 'proof',
  region: 'us-east-1',
  endpoint: 'http://localhost:9000',
  accessKeyId: 'key',
  secretAccessKey: 'secret',
  forcePathStyle: true,
});

describe('S3FileStorage', () => {
  it('signs a link that expires, saves under the original name and keeps the type', async () => {
    const url = new URL(
      await storage.signedDownloadUrl('evidence/c1/u1/Scan report.pdf', {
        fileName: 'Scan report.pdf',
        contentType: 'application/pdf',
        expiresInSeconds: 300,
      }),
    );
    expect(url.origin).toBe('http://localhost:9000');
    expect(url.pathname).toBe('/proof/evidence/c1/u1/Scan%20report.pdf');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('300');
    expect(url.searchParams.get('response-content-disposition')).toBe(
      "attachment; filename*=UTF-8''Scan%20report.pdf",
    );
    expect(url.searchParams.get('response-content-type')).toBe('application/pdf');
  });

  it('is enabled', () => {
    expect(storage.isEnabled()).toBe(true);
  });
});

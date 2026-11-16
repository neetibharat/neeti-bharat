'use client';

import type { ErrorCode } from '@dpdp-kit/shared';
import { useState } from 'react';
import { fileNameFromDisposition } from '@/lib/download';

async function failure(response: Response): Promise<{ code: ErrorCode }> {
  const body: unknown = await response.json().catch(() => null);
  const code = typeof body === 'object' && body && 'code' in body ? body.code : null;
  return { code: (typeof code === 'string' ? code : 'INTERNAL') as ErrorCode };
}

/** Fetches a file from the API with the session cookie and hands it to the browser to save. */
export function useDownload(path: string, fallbackName: string) {
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function download() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/v1${path}`, { credentials: 'same-origin' });
      if (!response.ok) throw await failure(response);
      const name = fileNameFromDisposition(
        response.headers.get('Content-Disposition'),
        fallbackName,
      );
      save(await response.blob(), name);
    } catch (caught) {
      setError(caught instanceof TypeError ? { code: 'INTERNAL' } : caught);
    } finally {
      setLoading(false);
    }
  }

  return { download, isLoading, error };
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

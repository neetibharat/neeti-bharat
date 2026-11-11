export interface PutOptions {
  contentType: string;
  /** Hex SHA-256 of the contents. Kept with the object so it can be checked later. */
  sha256?: string;
}

export interface DownloadOptions {
  /** The name the browser saves the file under. */
  fileName: string;
  contentType: string;
  expiresInSeconds: number;
}

/**
 * Where uploaded files are kept. Services depend on this, never on a provider's SDK, so another driver
 * (for example Azure Blob) can be added without touching them. Objects are private: they are only reachable
 * through a short-lived link from `signedDownloadUrl`.
 */
export abstract class FileStorage {
  /** False when no storage is configured; every other method then refuses with STORAGE_NOT_CONFIGURED. */
  abstract isEnabled(): boolean;
  abstract put(key: string, body: Buffer, options: PutOptions): Promise<void>;
  /** The whole object, for the audit pack. Uploads are capped, so one fits in memory. */
  abstract read(key: string): Promise<Buffer>;
  abstract signedDownloadUrl(key: string, options: DownloadOptions): Promise<string>;
  abstract remove(key: string): Promise<void>;
}

import {
  BlobSASPermissions,
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  type ContainerClient,
} from '@azure/storage-blob';
import { Injectable } from '@nestjs/common';
import { attachmentDisposition } from './content-disposition';
import { FileStorage, type DownloadOptions, type PutOptions } from './file-storage';

export interface AzureBlobSettings {
  account: string;
  /** An account key of the storage account. */
  accountKey: string;
  container: string;
  /** Leave out for Azure; set for the Azurite emulator. */
  endpoint?: string;
}

/** A link may be used a little before the clock of the server that made it says it can. */
const CLOCK_SKEW_MS = 5 * 60 * 1000;

/** Azure Blob Storage. Files are private; a download is a short-lived link signed with the account key. */
@Injectable()
export class AzureBlobFileStorage extends FileStorage {
  private readonly credential: StorageSharedKeyCredential;
  private readonly container: ContainerClient;

  constructor(private readonly settings: AzureBlobSettings) {
    super();
    this.credential = new StorageSharedKeyCredential(settings.account, settings.accountKey);
    const endpoint = settings.endpoint ?? `https://${settings.account}.blob.core.windows.net`;
    this.container = new BlobServiceClient(endpoint, this.credential).getContainerClient(
      settings.container,
    );
  }

  isEnabled(): boolean {
    return true;
  }

  async put(key: string, body: Buffer, options: PutOptions): Promise<void> {
    await this.container.getBlockBlobClient(key).uploadData(body, {
      blobHTTPHeaders: { blobContentType: options.contentType },
      ...(options.sha256 && { metadata: { sha256: options.sha256 } }),
    });
  }

  read(key: string): Promise<Buffer> {
    return this.container.getBlockBlobClient(key).downloadToBuffer();
  }

  signedDownloadUrl(key: string, options: DownloadOptions): Promise<string> {
    const blob = this.container.getBlockBlobClient(key);
    const now = Date.now();
    const sas = generateBlobSASQueryParameters(
      {
        containerName: this.settings.container,
        blobName: key,
        permissions: BlobSASPermissions.parse('r'),
        startsOn: new Date(now - CLOCK_SKEW_MS),
        expiresOn: new Date(now + options.expiresInSeconds * 1000),
        contentDisposition: attachmentDisposition(options.fileName),
        contentType: options.contentType,
      },
      this.credential,
    );
    return Promise.resolve(`${blob.url}?${sas.toString()}`);
  }

  async remove(key: string): Promise<void> {
    await this.container.getBlobClient(key).deleteIfExists();
  }
}

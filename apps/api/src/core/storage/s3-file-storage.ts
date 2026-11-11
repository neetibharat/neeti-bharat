import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { attachmentDisposition } from './content-disposition';
import { FileStorage, type DownloadOptions, type PutOptions } from './file-storage';

export interface S3Settings {
  bucket: string;
  region: string;
  /** Leave out for AWS S3; set for MinIO, Cloudflare R2 and other S3-compatible services. */
  endpoint?: string;
  /** Leave both keys out to use the default AWS credential chain. */
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle: boolean;
}

/** Any S3-compatible service: AWS S3, MinIO, Cloudflare R2, DigitalOcean Spaces, Backblaze B2. */
@Injectable()
export class S3FileStorage extends FileStorage {
  private readonly client: S3Client;

  constructor(private readonly settings: S3Settings) {
    super();
    const { accessKeyId, secretAccessKey } = settings;
    this.client = new S3Client({
      region: settings.region,
      endpoint: settings.endpoint,
      forcePathStyle: settings.forcePathStyle,
      ...(accessKeyId && secretAccessKey && { credentials: { accessKeyId, secretAccessKey } }),
      // Newer SDKs add a checksum to every request by default, which several S3-compatible services reject.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  isEnabled(): boolean {
    return true;
  }

  async put(key: string, body: Buffer, options: PutOptions): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.settings.bucket,
        Key: key,
        Body: body,
        ContentType: options.contentType,
        ...(options.sha256 && { Metadata: { sha256: options.sha256 } }),
      }),
    );
  }

  signedDownloadUrl(key: string, options: DownloadOptions): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.settings.bucket,
      Key: key,
      ResponseContentDisposition: attachmentDisposition(options.fileName),
      ResponseContentType: options.contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: options.expiresInSeconds });
  }

  async remove(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.settings.bucket, Key: key }));
  }
}

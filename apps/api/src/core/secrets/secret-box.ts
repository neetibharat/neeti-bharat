import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../common/app.exception';

/**
 * Keeps secrets the app must be able to read back, such as the credentials of a connection. They are sealed with a key
 * held by whoever runs the install, so a copy of the database alone does not give them away. `context` ties a sealed
 * value to the place it belongs: one sealed for an organisation cannot be opened as another's.
 */
export abstract class SecretBox {
  /** False when no key is set; sealing and opening then refuse with SECRETS_NOT_CONFIGURED. */
  abstract isEnabled(): boolean;
  abstract seal(plain: string, context: string): string;
  abstract open(sealed: string, context: string): string;
}

const VERSION = 'v1';
const IV_BYTES = 12;
const KEY_BYTES = 32;

/** The key is 32 random bytes, written in base64: `openssl rand -base64 32`. */
export function isValidSecretKey(value: string): boolean {
  return Buffer.from(value, 'base64').length === KEY_BYTES;
}

/** AES-256-GCM. Each value gets its own random nonce, and a changed value or context fails to open. */
@Injectable()
export class AesSecretBox extends SecretBox {
  private readonly key: Buffer;

  constructor(base64Key: string) {
    super();
    if (!isValidSecretKey(base64Key)) throw new Error('The secrets key must be 32 bytes in base64');
    this.key = Buffer.from(base64Key, 'base64');
  }

  isEnabled(): boolean {
    return true;
  }

  seal(plain: string, context: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    cipher.setAAD(Buffer.from(context));
    const body = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return [VERSION, iv, cipher.getAuthTag(), body].map((part) => this.encode(part)).join('.');
  }

  open(sealed: string, context: string): string {
    const [version, iv, tag, body] = sealed.split('.');
    if (version !== VERSION || !iv || !tag || body === undefined) {
      throw new Error('This is not a sealed secret');
    }
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(iv, 'base64url'));
    decipher.setAAD(Buffer.from(context));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(body, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }

  private encode(part: Buffer | string): string {
    return typeof part === 'string' ? part : part.toString('base64url');
  }
}

/** Stands in when no key is set, so the features that need one fail with a clear code instead of storing in the clear. */
@Injectable()
export class DisabledSecretBox extends SecretBox {
  isEnabled(): boolean {
    return false;
  }

  seal(): never {
    return this.refuse();
  }

  open(): never {
    return this.refuse();
  }

  private refuse(): never {
    throw new AppException('SECRETS_NOT_CONFIGURED', HttpStatus.SERVICE_UNAVAILABLE);
  }
}

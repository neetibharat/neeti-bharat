import { HttpStatus, Injectable } from '@nestjs/common';
import {
  API_KEY_ACTIVE_LIMIT,
  type ApiKeyListResponse,
  type ApiKeySummary,
  type CreatedApiKeyResponse,
} from '@dpdp-kit/shared';
import { ActivityService } from '../../activity/services/activity.service';
import type { Actor } from '../../core/common/actor';
import { AppException } from '../../core/common/app.exception';
import type { ApiKey } from '../../generated/prisma/client';
import type { CreateApiKeyInput } from '../dto/api-key.dto';
import { ApiKeyRepository } from '../repositories/api-key.repository';
import { generateKey } from '../utils/key-secret';

const DAY_MS = 86_400_000;

const toSummary = (row: ApiKey): ApiKeySummary => ({
  id: row.id,
  name: row.name,
  role: row.role,
  prefix: row.prefix,
  createdByName: row.createdByName,
  createdAt: row.createdAt.toISOString(),
  expiresAt: row.expiresAt?.toISOString() ?? null,
  lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
  revokedAt: row.revokedAt?.toISOString() ?? null,
});

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly keys: ApiKeyRepository,
    private readonly activity: ActivityService,
  ) {}

  async list(page: number, limit: number): Promise<ApiKeyListResponse> {
    const { rows, total } = await this.keys.list(page, limit);
    return { items: rows.map(toSummary), total, page, pageSize: limit };
  }

  /** Makes a key. The whole key is in the answer once, and cannot be read again. */
  async create(input: CreateApiKeyInput, actor: Actor): Promise<CreatedApiKeyResponse> {
    const now = new Date();
    if ((await this.keys.countActive(now)) >= API_KEY_ACTIVE_LIMIT) {
      throw new AppException('API_KEY_LIMIT', HttpStatus.CONFLICT, { limit: API_KEY_ACTIVE_LIMIT });
    }
    const secret = generateKey();
    const row = await this.keys.create({
      name: input.name,
      role: input.role,
      prefix: secret.prefix,
      keyHash: secret.hash,
      createdById: actor.id,
      createdByName: actor.label,
      expiresAt: input.expiresInDays
        ? new Date(now.getTime() + input.expiresInDays * DAY_MS)
        : null,
    });
    await this.activity.record({
      actor,
      action: 'API_KEY_CREATED',
      subject: { type: 'api_key', id: row.id },
      details: { name: row.name, role: row.role },
    });
    return { ...toSummary(row), key: secret.key };
  }

  async revoke(id: string, actor: Actor): Promise<void> {
    const row = await this.keys.findById(id);
    if (!row) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    if (row.revokedAt) return;
    await this.keys.revoke(id, new Date());
    await this.activity.record({
      actor,
      action: 'API_KEY_REVOKED',
      subject: { type: 'api_key', id },
      details: { name: row.name },
    });
  }
}

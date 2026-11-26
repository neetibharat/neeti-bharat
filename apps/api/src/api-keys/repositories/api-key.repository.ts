import { Injectable } from '@nestjs/common';
import type { ApiKeyRole } from '@neeti-bharat/shared';
import type { ApiKey, AppRole } from '../../generated/prisma/client';
import { currentOrganizationId } from '../../core/org/org-context';
import { PrismaService } from '../../core/prisma/prisma.service';

export interface NewApiKey {
  name: string;
  role: ApiKeyRole;
  prefix: string;
  keyHash: string;
  createdById: string;
  createdByName: string;
  expiresAt: Date | null;
}

/** A key and the creator's place in the key's organisation, which decides whether the key still works. */
export interface KeyForSignIn {
  id: string;
  organizationId: string;
  role: AppRole;
  expiresAt: Date | null;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  createdBy: { id: string; name: string; email: string };
  creatorRole: AppRole | null;
}

/**
 * Keys belong to an organisation but are looked up before one is known, so this table is not scoped by the database
 * layer. Every method that runs inside a request names the organisation itself.
 */
@Injectable()
export class ApiKeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: NewApiKey): Promise<ApiKey> {
    return this.prisma.db.apiKey.create({
      data: { ...data, organizationId: currentOrganizationId() },
    });
  }

  findById(id: string): Promise<ApiKey | null> {
    return this.prisma.db.apiKey.findFirst({
      where: { id, organizationId: currentOrganizationId() },
    });
  }

  /** One page of keys, newest first. */
  async list(page: number, limit: number) {
    const where = { organizationId: currentOrganizationId() };
    const [rows, total] = await Promise.all([
      this.prisma.db.apiKey.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.db.apiKey.count({ where }),
    ]);
    return { rows, total };
  }

  countActive(now: Date): Promise<number> {
    return this.prisma.db.apiKey.count({
      where: {
        organizationId: currentOrganizationId(),
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });
  }

  async revoke(id: string, at: Date): Promise<void> {
    await this.prisma.db.apiKey.updateMany({
      where: { id, organizationId: currentOrganizationId(), revokedAt: null },
      data: { revokedAt: at },
    });
  }

  /** The key with this hash, for a request that has sent one. Runs before any organisation is set. */
  async findForSignIn(keyHash: string): Promise<KeyForSignIn | null> {
    const row = await this.prisma.db.apiKey.findUnique({
      where: { keyHash },
      select: {
        id: true,
        organizationId: true,
        role: true,
        expiresAt: true,
        revokedAt: true,
        lastUsedAt: true,
        organization: { select: { closedAt: true } },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            memberships: { select: { organizationId: true, role: true, disabledAt: true } },
          },
        },
      },
    });
    if (!row) return null;
    const { memberships, ...createdBy } = row.createdBy;
    const place = memberships.find((m) => m.organizationId === row.organizationId && !m.disabledAt);
    return {
      id: row.id,
      organizationId: row.organizationId,
      role: row.role,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      lastUsedAt: row.lastUsedAt,
      createdBy,
      // A closed organisation cannot be opened, with a key either.
      creatorRole: row.organization.closedAt ? null : (place?.role ?? null),
    };
  }

  async markUsed(id: string, at: Date): Promise<void> {
    await this.prisma.db.apiKey.update({ where: { id }, data: { lastUsedAt: at } });
  }
}

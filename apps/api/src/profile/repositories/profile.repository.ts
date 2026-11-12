import { Injectable } from '@nestjs/common';
import { currentOrganizationId } from '../../core/org/org-context';
import { orgOwned } from '../../core/org/keys';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { ProfileEntry } from '../../generated/prisma/client';

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ProfileEntry[]> {
    return this.prisma.db.profileEntry.findMany({ orderBy: { createdAt: 'asc' } });
  }

  findByKey(key: string): Promise<ProfileEntry | null> {
    return this.prisma.db.profileEntry.findFirst({ where: { key } });
  }

  /** Stores an answer, creating its row the first time a built-in answer is changed. */
  upsert(key: string, value: string): Promise<ProfileEntry> {
    const organizationId = currentOrganizationId();
    return this.prisma.db.profileEntry.upsert({
      where: { organizationId_key: { organizationId, key } },
      create: { organizationId, key, value },
      update: { value },
    });
  }

  createCustom(data: { key: string; label: string; value: string }): Promise<ProfileEntry> {
    return this.prisma.db.profileEntry.create({ data: { ...data, ...orgOwned(), isCustom: true } });
  }

  /** Removes an answer people added. Built-in answers are never deleted. Returns it, or null if there was none. */
  async deleteCustom(key: string): Promise<ProfileEntry | null> {
    const existing = await this.prisma.db.profileEntry.findFirst({
      where: { key, isCustom: true },
    });
    if (!existing) return null;
    return this.prisma.db.profileEntry.delete({
      where: { organizationId_key: { organizationId: currentOrganizationId(), key } },
    });
  }
}

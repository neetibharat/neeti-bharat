import { Injectable } from '@nestjs/common';
import { currentOrganizationId } from '../../core/org/org-context';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { AppRole } from '../../generated/prisma/client';

/** Someone with an account, as they are in the organisation the request works in. */
export interface Account {
  id: string;
  email: string;
  role: AppRole;
  /** Set when they have left this organisation. */
  disabledAt: Date | null;
}

interface MemberRow {
  role: AppRole;
  disabledAt: Date | null;
  user: { id: string; email: string };
}

const MEMBER = {
  role: true,
  disabledAt: true,
  user: { select: { id: true, email: true } },
} as const;

const toAccount = (row: MemberRow): Account => ({
  id: row.user.id,
  email: row.user.email,
  role: row.role,
  disabledAt: row.disabledAt,
});

/**
 * Accounts belong to the whole install, but what someone may do belongs to an organisation. Everything here that
 * speaks of a role, or of being switched off, is about the organisation the request works in.
 */
@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Every account in the install, in every organisation. */
  countAll(): Promise<number> {
    return this.prisma.db.user.count();
  }

  findAnywhere(email: string): Promise<{ id: string; email: string } | null> {
    return this.prisma.db.user.findUnique({ where: { email }, select: { id: true, email: true } });
  }

  findById(id: string): Promise<{ id: string; email: string; name: string } | null> {
    return this.prisma.db.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    return (await this.findByEmail(email)) !== null;
  }

  async findByEmail(email: string): Promise<Account | null> {
    const row = await this.prisma.db.membership.findFirst({
      where: { organizationId: currentOrganizationId(), user: { email } },
      select: MEMBER,
    });
    return row && toAccount(row);
  }

  async findByEmails(emails: string[]): Promise<Account[]> {
    const rows = await this.prisma.db.membership.findMany({
      where: { organizationId: currentOrganizationId(), user: { email: { in: emails } } },
      select: MEMBER,
    });
    return rows.map(toAccount);
  }

  /** How many members can open this organisation. */
  countActive(): Promise<number> {
    return this.prisma.db.membership.count({
      where: { organizationId: currentOrganizationId(), disabledAt: null },
    });
  }

  /** How many admins can open this organisation. The rows stay locked until the request ends, so two cannot remove each other. */
  async countActiveAdmins(): Promise<number> {
    const admins = await this.prisma.db.$queryRaw<{ id: string }[]>`
      SELECT id FROM memberships
      WHERE "organizationId" = ${currentOrganizationId()} AND role = 'admin' AND "disabledAt" IS NULL
      FOR UPDATE`;
    return admins.length;
  }

  /** Changes what someone may do here, and lets them back in if they had left. */
  async setRole(userId: string, role: AppRole): Promise<void> {
    await this.prisma.db.membership.update({
      where: { organizationId_userId: { organizationId: currentOrganizationId(), userId } },
      data: { role, disabledAt: null },
    });
  }

  /**
   * Stops someone opening this organisation. Their sessions end too, but only when this was the last organisation
   * they could open, so leaving one does not sign them out of another.
   */
  async disable(userId: string, now: Date): Promise<void> {
    const organizationId = currentOrganizationId();
    await this.prisma.transact(async (db) => {
      await db.membership.update({
        where: { organizationId_userId: { organizationId, userId } },
        data: { disabledAt: now },
      });
      const stillOpen = await db.membership.count({ where: { userId, disabledAt: null } });
      if (stillOpen === 0) await db.session.deleteMany({ where: { userId } });
    });
  }
}

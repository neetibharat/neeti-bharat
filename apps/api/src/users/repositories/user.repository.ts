import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { AppRole } from '../../generated/prisma/client';

/** The parts of an account the rest of the app needs. */
export interface Account {
  id: string;
  email: string;
  role: AppRole;
  disabledAt: Date | null;
}

const ACCOUNT = { id: true, email: true, role: true, disabledAt: true } as const;

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  count(): Promise<number> {
    return this.prisma.db.user.count();
  }

  async existsByEmail(email: string): Promise<boolean> {
    return (await this.prisma.db.user.count({ where: { email } })) > 0;
  }

  findByEmail(email: string): Promise<Account | null> {
    return this.prisma.db.user.findUnique({ where: { email }, select: ACCOUNT });
  }

  findByEmails(emails: string[]): Promise<Account[]> {
    return this.prisma.db.user.findMany({ where: { email: { in: emails } }, select: ACCOUNT });
  }

  async isDisabled(id: string): Promise<boolean> {
    const user = await this.prisma.db.user.findUnique({
      where: { id },
      select: { disabledAt: true },
    });
    return Boolean(user?.disabledAt);
  }

  /** Admins who can still sign in. The last one must never be removed or demoted. */
  countActive(): Promise<number> {
    return this.prisma.db.user.count({ where: { disabledAt: null } });
  }

  /** How many admins can sign in. The rows stay locked until the request ends, so two cannot remove each other. */
  async countActiveAdmins(): Promise<number> {
    const admins = await this.prisma.db.$queryRaw<{ id: string }[]>`
      SELECT id FROM users WHERE role = 'admin' AND "disabledAt" IS NULL FOR UPDATE`;
    return admins.length;
  }

  /** Changes what someone may do, and lets them sign in again if they had been disabled. */
  async setRole(id: string, role: AppRole): Promise<void> {
    await this.prisma.db.user.update({ where: { id }, data: { role, disabledAt: null } });
  }

  /** Blocks sign-in, and ends every session they have right now, so access stops at once. */
  async disable(id: string, now: Date): Promise<void> {
    await this.prisma.transact(async (db) => {
      await db.user.update({ where: { id }, data: { disabledAt: now } });
      await db.session.deleteMany({ where: { userId: id } });
    });
  }
}

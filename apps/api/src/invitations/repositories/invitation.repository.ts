import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { AppRole, Invitation } from '../../generated/prisma/client';

@Injectable()
export class InvitationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    email: string;
    role: AppRole;
    invitedById: string;
    expiresAt: Date;
  }): Promise<Invitation> {
    return this.prisma.db.invitation.create({ data });
  }

  /** Open invitations for these emails, newest first, so the latest one for an email wins. */
  findOpenByEmails(emails: string[], now: Date): Promise<Invitation[]> {
    return this.prisma.db.invitation.findMany({
      where: { email: { in: emails }, status: 'pending', expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    });
  }

  countOpen(now: Date): Promise<number> {
    return this.prisma.db.invitation.count({
      where: { status: 'pending', expiresAt: { gt: now } },
    });
  }

  findOpenByEmail(email: string, now: Date): Promise<Invitation | null> {
    return this.prisma.db.invitation.findFirst({
      where: { email, status: 'pending', expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Cancels an open invitation and returns it, or null if there was none to cancel. */
  async revoke(id: string): Promise<Invitation | null> {
    const open = await this.prisma.db.invitation.findFirst({ where: { id, status: 'pending' } });
    if (!open) return null;
    return this.prisma.db.invitation.update({ where: { id }, data: { status: 'revoked' } });
  }

  async markAccepted(email: string, now: Date): Promise<void> {
    await this.prisma.db.invitation.updateMany({
      where: { email, status: 'pending' },
      data: { status: 'accepted', acceptedAt: now },
    });
  }
}

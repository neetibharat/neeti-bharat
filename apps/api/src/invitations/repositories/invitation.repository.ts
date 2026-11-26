import { Injectable } from '@nestjs/common';
import { currentOrganizationId } from '../../core/org/org-context';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { AppRole, Invitation } from '../../generated/prisma/client';

/**
 * Invitations belong to an organisation. Most of what is here works on the one the request is for. The two
 * `...Anywhere` methods are for sign-in, when a person has no organisation yet and every invitation to them counts.
 */
@Injectable()
export class InvitationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    email: string;
    role: AppRole;
    invitedById: string;
    expiresAt: Date;
  }): Promise<Invitation> {
    return this.prisma.db.invitation.create({
      data: { ...data, organizationId: currentOrganizationId() },
    });
  }

  /** The name of the organisation the request is for, to say in the invitation which one it is. */
  async organizationName(): Promise<string> {
    const row = await this.prisma.db.organization.findUnique({
      where: { id: currentOrganizationId() },
      select: { name: true },
    });
    return row?.name ?? 'Neeti Bharat';
  }

  /** Open invitations for these emails, newest first, so the latest one for an email wins. */
  findOpenByEmails(emails: string[], now: Date): Promise<Invitation[]> {
    return this.prisma.db.invitation.findMany({
      where: {
        organizationId: currentOrganizationId(),
        email: { in: emails },
        status: 'pending',
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Invitations nobody has accepted or cancelled yet, expired or not, newest first. */
  findPendingByEmails(emails: string[]): Promise<Invitation[]> {
    return this.prisma.db.invitation.findMany({
      where: { organizationId: currentOrganizationId(), email: { in: emails }, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
  }

  findLatestPendingByEmail(email: string): Promise<Invitation | null> {
    return this.prisma.db.invitation.findFirst({
      where: { organizationId: currentOrganizationId(), email, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Gives an invitation a new last day. */
  renew(id: string, expiresAt: Date): Promise<Invitation> {
    return this.prisma.db.invitation.update({
      where: { id, organizationId: currentOrganizationId() },
      data: { expiresAt },
    });
  }

  countOpen(now: Date): Promise<number> {
    return this.prisma.db.invitation.count({
      where: { organizationId: currentOrganizationId(), status: 'pending', expiresAt: { gt: now } },
    });
  }

  findOpenByEmail(email: string, now: Date): Promise<Invitation | null> {
    return this.prisma.db.invitation.findFirst({
      where: {
        organizationId: currentOrganizationId(),
        email,
        status: 'pending',
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Every open invitation to this email, from any organisation, oldest first. */
  findOpenAnywhere(email: string, now: Date): Promise<Invitation[]> {
    return this.prisma.db.invitation.findMany({
      where: { email, status: 'pending', expiresAt: { gt: now } },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Cancels an open invitation and returns it, or null if there was none to cancel. */
  async revoke(id: string): Promise<Invitation | null> {
    const organizationId = currentOrganizationId();
    const open = await this.prisma.db.invitation.findFirst({
      where: { id, organizationId, status: 'pending' },
    });
    if (!open) return null;
    return this.prisma.db.invitation.update({
      where: { id, organizationId },
      data: { status: 'revoked' },
    });
  }

  async markAccepted(id: string, now: Date): Promise<void> {
    await this.prisma.db.invitation.update({
      where: { id },
      data: { status: 'accepted', acceptedAt: now },
    });
  }
}

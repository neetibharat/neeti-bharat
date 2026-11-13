import { Injectable } from '@nestjs/common';
import type { AppRole } from '../../generated/prisma/enums';
import { currentOrganizationId } from '../../core/org/org-context';
import { PrismaService } from '../../core/prisma/prisma.service';

/** Someone who can sign in to the organisation and is also on the company's list of people. */
export interface Recipient {
  userId: string;
  email: string;
  personId: string;
  role: AppRole;
}

@Injectable()
export class RecipientRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** The organisations that are still open. Organisations are not scoped, so this works outside a request. */
  openOrganizations(): Promise<{ id: string; name: string }[]> {
    return this.prisma.db.organization.findMany({
      where: { closedAt: null },
      select: { id: true, name: true },
    });
  }

  /** Active people who have a login here. A person is matched to a login by email, as everywhere else. */
  async recipients(): Promise<Recipient[]> {
    const [people, members] = await Promise.all([
      this.prisma.db.person.findMany({
        where: { status: 'active' },
        select: { id: true, email: true },
      }),
      this.prisma.db.membership.findMany({
        where: { organizationId: currentOrganizationId(), disabledAt: null },
        select: { userId: true, role: true, user: { select: { email: true } } },
      }),
    ]);
    const personByEmail = new Map(people.map((p) => [p.email.toLowerCase(), p.id]));
    return members.flatMap((member) => {
      const email = member.user.email.toLowerCase();
      const personId = personByEmail.get(email);
      return personId ? [{ userId: member.userId, email, personId, role: member.role }] : [];
    });
  }
}

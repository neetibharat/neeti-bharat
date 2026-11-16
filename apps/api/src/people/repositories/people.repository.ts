import { Injectable } from '@nestjs/common';
import type { JobRole } from '@dpdp-kit/shared';
import { currentOrganizationId } from '../../core/org/org-context';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { Person, RoleAssignment } from '../../generated/prisma/client';

export type PersonWithRoles = Person & { roles: RoleAssignment[] };

export interface NewPerson {
  name: string;
  email: string;
  department?: string;
  jobTitle?: string;
}

export interface PageQuery {
  status: 'active' | 'left';
  q?: string;
  page: number;
  limit: number;
}

const searchFields = (q: string) =>
  (['name', 'email', 'jobTitle', 'department'] as const).map((field) => ({
    [field]: { contains: q, mode: 'insensitive' as const },
  }));

export type RoleHolding = RoleAssignment & { person: Person };

/** What marking someone as left changed besides their own status. */
export interface LeaveOutcome {
  roles: JobRole[];
  assignments: number;
}

@Injectable()
export class PeopleRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** One page of people with a given status, matching a search on name, email, job title or department. */
  async findPage(query: PageQuery): Promise<{ rows: PersonWithRoles[]; total: number }> {
    const where = {
      status: query.status,
      ...(query.q ? { OR: searchFields(query.q) } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.db.person.findMany({
        where,
        include: { roles: true },
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.db.person.count({ where }),
    ]);
    return { rows, total };
  }

  async countByStatus(): Promise<{ active: number; left: number }> {
    const groups = await this.prisma.db.person.groupBy({ by: ['status'], _count: { _all: true } });
    const count = (status: string) => groups.find((g) => g.status === status)?._count._all ?? 0;
    return { active: count('active'), left: count('left') };
  }

  findWithRoles(id: string): Promise<PersonWithRoles | null> {
    return this.prisma.db.person.findUnique({ where: { id }, include: { roles: true } });
  }

  /** Active people, by name, with only what a picker shows. */
  activeOptions(): Promise<{ id: string; name: string }[]> {
    return this.prisma.db.person.findMany({
      where: { status: 'active' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  findActiveByEmail(email: string): Promise<{ id: string; name: string } | null> {
    return this.prisma.db.person.findFirst({
      where: { status: 'active', email: { equals: email, mode: 'insensitive' } },
      select: { id: true, name: true },
    });
  }

  findActiveById(id: string): Promise<{ id: string; name: string } | null> {
    return this.prisma.db.person.findFirst({
      where: { id, status: 'active' },
      select: { id: true, name: true },
    });
  }

  rolesOf(personId: string): Promise<{ role: JobRole }[]> {
    return this.prisma.db.roleAssignment.findMany({ where: { personId }, select: { role: true } });
  }

  /** Every job that has a holder, without the holder's details. */
  assignments(): Promise<RoleAssignment[]> {
    return this.prisma.db.roleAssignment.findMany();
  }

  findById(id: string): Promise<Person | null> {
    return this.prisma.db.person.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<Person | null> {
    return this.prisma.db.person.findFirst({ where: { email } });
  }

  create(data: NewPerson): Promise<Person> {
    return this.prisma.db.person.create({
      data: { ...data, organizationId: currentOrganizationId() },
    });
  }

  /** Makes sure an account has a person, without touching one that already exists. */
  ensure(data: { name: string; email: string }): Promise<Person> {
    const organizationId = currentOrganizationId();
    return this.prisma.db.person.upsert({
      where: { organizationId_email: { organizationId, email: data.email } },
      create: { ...data, organizationId },
      update: {},
    });
  }

  update(
    id: string,
    data: { name?: string; department?: string | null; jobTitle?: string | null },
  ): Promise<Person> {
    return this.prisma.db.person.update({ where: { id }, data });
  }

  /**
   * Marks someone as left, frees every role they held, and takes their name off any control, proof requirement,
   * breach, request and policy approval, which then fall back to their role or to an admin. All or nothing.
   */
  async markLeft(id: string, now: Date): Promise<LeaveOutcome> {
    return this.prisma.transact(async (db) => {
      const held = await db.roleAssignment.findMany({ where: { personId: id } });
      await db.roleAssignment.deleteMany({ where: { personId: id } });
      const controls = await db.control.updateMany({
        where: { assigneeId: id },
        data: { assigneeId: null },
      });
      const proofs = await db.proofRequirement.updateMany({
        where: { assigneeId: id },
        data: { assigneeId: null },
      });
      const breaches = await db.breach.updateMany({
        where: { assigneeId: id },
        data: { assigneeId: null },
      });
      const requests = await db.dataRequest.updateMany({
        where: { assigneeId: id },
        data: { assigneeId: null },
      });
      const policies = await db.policy.updateMany({
        where: { approverId: id },
        data: { approverId: null },
      });
      await db.person.update({ where: { id }, data: { status: 'left', leftAt: now } });
      return {
        roles: held.map((assignment) => assignment.role),
        assignments:
          controls.count + proofs.count + breaches.count + requests.count + policies.count,
      };
    });
  }

  roleHoldings(): Promise<RoleHolding[]> {
    return this.prisma.db.roleAssignment.findMany({ include: { person: true } });
  }

  findRoleHolding(role: JobRole): Promise<RoleHolding | null> {
    return this.prisma.db.roleAssignment.findUnique({
      where: { organizationId_role: { organizationId: currentOrganizationId(), role } },
      include: { person: true },
    });
  }

  assignRole(role: JobRole, personId: string, since: Date): Promise<RoleAssignment> {
    const organizationId = currentOrganizationId();
    return this.prisma.db.roleAssignment.upsert({
      where: { organizationId_role: { organizationId, role } },
      create: { organizationId, role, personId, since },
      update: { personId, since },
    });
  }

  async clearRole(role: JobRole): Promise<void> {
    await this.prisma.db.roleAssignment.deleteMany({ where: { role } });
  }
}

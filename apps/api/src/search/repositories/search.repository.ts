import { Injectable } from '@nestjs/common';
import type { SearchHit } from '@dpdp-kit/shared';
import { PrismaService } from '../../core/prisma/prisma.service';

/** The most hits shown for each kind of record. */
const PER_KIND = 5;

const like = (q: string) => ({ contains: q, mode: 'insensitive' as const });
const first = { take: PER_KIND, orderBy: { id: 'asc' as const } };

@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async policies(q: string): Promise<SearchHit[]> {
    const rows = await this.prisma.db.policy.findMany({
      where: { archivedAt: null, OR: [{ title: like(q) }, { summary: like(q) }] },
      select: { id: true, title: true },
      ...first,
    });
    return rows.map((row) => ({ kind: 'policy', id: row.id, title: row.title }));
  }

  async proof(q: string): Promise<SearchHit[]> {
    const rows = await this.prisma.db.proofRequirement.findMany({
      where: { archivedAt: null, title: like(q) },
      select: { id: true, title: true },
      ...first,
    });
    return rows.map((row) => ({ kind: 'proof', id: row.id, title: row.title }));
  }

  async vendors(q: string): Promise<SearchHit[]> {
    const rows = await this.prisma.db.vendor.findMany({
      where: { archivedAt: null, OR: [{ name: like(q) }, { service: like(q) }] },
      select: { id: true, name: true, service: true },
      ...first,
    });
    return rows.map((row) => ({
      kind: 'vendor',
      id: row.id,
      title: row.name,
      detail: row.service,
    }));
  }

  async breaches(q: string): Promise<SearchHit[]> {
    const rows = await this.prisma.db.breach.findMany({
      where: { title: like(q) },
      select: { id: true, title: true },
      ...first,
    });
    return rows.map((row) => ({ kind: 'breach', id: row.id, title: row.title }));
  }

  async requests(q: string): Promise<SearchHit[]> {
    const rows = await this.prisma.db.dataRequest.findMany({
      where: { OR: [{ personName: like(q) }, { personEmail: like(q) }] },
      select: { id: true, number: true, personName: true },
      ...first,
    });
    return rows.map((row) => ({
      kind: 'request',
      id: row.id,
      title: row.personName,
      detail: `REQ-${row.number}`,
    }));
  }

  async rules(q: string): Promise<SearchHit[]> {
    const rows = await this.prisma.db.requirement.findMany({
      where: { archivedAt: null, OR: [{ title: like(q) }, { reference: like(q) }] },
      select: { id: true, frameworkId: true, reference: true, title: true },
      ...first,
    });
    return rows.map((row) => ({
      kind: 'rule',
      id: row.id,
      frameworkId: row.frameworkId,
      title: row.title,
      detail: row.reference,
    }));
  }

  async controls(q: string): Promise<SearchHit[]> {
    const rows = await this.prisma.db.control.findMany({
      where: { archivedAt: null, title: like(q) },
      select: { id: true, frameworkId: true, requirementId: true, title: true },
      ...first,
    });
    return rows.map((row) => ({
      kind: 'control',
      id: row.id,
      frameworkId: row.frameworkId,
      ruleId: row.requirementId,
      title: row.title,
    }));
  }

  async people(q: string): Promise<SearchHit[]> {
    const rows = await this.prisma.db.person.findMany({
      where: { OR: [{ name: like(q) }, { email: like(q) }] },
      select: { id: true, name: true, email: true },
      ...first,
    });
    return rows.map((row) => ({
      kind: 'person',
      id: row.id,
      title: row.name,
      detail: row.email,
    }));
  }
}

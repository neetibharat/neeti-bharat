import { Injectable } from '@nestjs/common';
import type { VendorCounts, VendorTab } from '@neeti-bharat/shared';
import { currentOrganizationId } from '../../core/org/org-context';
import { PrismaService } from '../../core/prisma/prisma.service';
import type {
  Prisma,
  Vendor,
  VendorCategory,
  VendorLocation,
  VendorStatus,
  VendorTreatment,
} from '../../generated/prisma/client';

export type VendorRow = Vendor & { owner: { id: string; name: string } | null };

/** The two ends of a place on the risk grid, as they are stored. Null until rated. */
export interface RatingColumns {
  inherentLikelihood?: number | null;
  inherentImpact?: number | null;
  residualLikelihood?: number | null;
  residualImpact?: number | null;
}

export interface NewVendor extends RatingColumns {
  treatment?: VendorTreatment | null;
  treatmentNote?: string | null;
  name: string;
  website?: string;
  service: string;
  category: VendorCategory;
  status: VendorStatus;
  dataKinds: string[];
  location?: VendorLocation;
  agreementUrl?: string;
  nextReviewOn?: Date | null;
  ownerId?: string;
}

export interface VendorChanges extends RatingColumns {
  treatment?: VendorTreatment | null;
  treatmentNote?: string | null;
  name?: string;
  website?: string | null;
  service?: string;
  category?: VendorCategory;
  status?: VendorStatus;
  dataKinds?: string[];
  location?: VendorLocation | null;
  agreementUrl?: string | null;
  nextReviewOn?: Date | null;
  ownerId?: string | null;
}

export interface PageQuery {
  tab: VendorTab;
  q?: string;
  page: number;
  limit: number;
  /** The start of today, which dates are compared with. */
  today: Date;
}

const withOwner = { owner: { select: { id: true, name: true } } } as const;

const searchFields = (q: string): Prisma.VendorWhereInput[] =>
  (['name', 'website', 'service'] as const).map((field) => ({
    [field]: { contains: q, mode: 'insensitive' as const },
  }));

/** Vendors in use whose details are not filled in, that are not assessed yet, or whose review date has passed. */
const needsAttention = (today: Date): Prisma.VendorWhereInput => ({
  archivedAt: null,
  OR: [
    { location: null },
    { dataKinds: { isEmpty: true } },
    { status: { not: 'assessed' } },
    { nextReviewOn: { lt: today } },
  ],
});

function tabFilter(tab: VendorTab, today: Date): Prisma.VendorWhereInput {
  if (tab === 'attention') return needsAttention(today);
  return { archivedAt: tab === 'active' ? null : { not: null } };
}

@Injectable()
export class VendorRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** One page of vendors in a tab, matching a search on name, website or what they do. */
  async findPage(query: PageQuery): Promise<{ rows: VendorRow[]; total: number }> {
    const where: Prisma.VendorWhereInput = {
      AND: [tabFilter(query.tab, query.today), ...(query.q ? [{ OR: searchFields(query.q) }] : [])],
    };
    const [rows, total] = await Promise.all([
      this.prisma.db.vendor.findMany({
        where,
        include: withOwner,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.db.vendor.count({ where }),
    ]);
    return { rows, total };
  }

  async counts(today: Date): Promise<VendorCounts> {
    const [active, attention, archived] = await Promise.all(
      (['active', 'attention', 'archived'] as const).map((tab) =>
        this.prisma.db.vendor.count({ where: tabFilter(tab, today) }),
      ),
    );
    return { active: active!, attention: attention!, archived: archived! };
  }

  /** Every vendor in use. */
  findActive(): Promise<Vendor[]> {
    return this.prisma.db.vendor.findMany({
      where: { archivedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string): Promise<VendorRow | null> {
    return this.prisma.db.vendor.findUnique({ where: { id }, include: withOwner });
  }

  /** A vendor with this name, ignoring capitals, other than the one given. */
  findByName(name: string, exceptId?: string): Promise<Vendor | null> {
    return this.prisma.db.vendor.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
    });
  }

  create(data: NewVendor): Promise<VendorRow> {
    return this.prisma.db.vendor.create({
      data: { ...data, organizationId: currentOrganizationId() },
      include: withOwner,
    });
  }

  update(id: string, data: VendorChanges): Promise<VendorRow> {
    return this.prisma.db.vendor.update({ where: { id }, data, include: withOwner });
  }

  setArchived(id: string, archivedAt: Date | null): Promise<VendorRow> {
    return this.prisma.db.vendor.update({
      where: { id },
      data: { archivedAt },
      include: withOwner,
    });
  }
}

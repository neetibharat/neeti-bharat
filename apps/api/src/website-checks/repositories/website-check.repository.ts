import { Injectable } from '@nestjs/common';
import type { WebsiteCheckResult } from '@neeti-bharat/shared';
import type { Prisma, WebsiteCheck } from '../../generated/prisma/client';
import { orgOwned } from '../../core/org/keys';
import { PrismaService } from '../../core/prisma/prisma.service';

export type WebsiteCheckSummaryRow = Omit<WebsiteCheck, 'results' | 'organizationId'>;

export interface NewWebsiteCheck {
  url: string;
  checkedByName: string;
  results: WebsiteCheckResult[];
  passed: number;
  warned: number;
  failed: number;
}

const summary = {
  id: true,
  url: true,
  checkedAt: true,
  checkedByName: true,
  passed: true,
  warned: true,
  failed: true,
} satisfies Prisma.WebsiteCheckSelect;

@Injectable()
export class WebsiteCheckRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: NewWebsiteCheck): Promise<WebsiteCheck> {
    return this.prisma.db.websiteCheck.create({
      data: { ...data, ...orgOwned(), results: data.results as unknown as Prisma.InputJsonValue },
    });
  }

  findById(id: string): Promise<WebsiteCheck | null> {
    return this.prisma.db.websiteCheck.findUnique({ where: { id } });
  }

  /** One page of runs, newest first, without their results. */
  async list(page: number, limit: number) {
    const [rows, total] = await Promise.all([
      this.prisma.db.websiteCheck.findMany({
        select: summary,
        orderBy: [{ checkedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.db.websiteCheck.count(),
    ]);
    return { rows, total };
  }
}

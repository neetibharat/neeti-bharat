import { Injectable } from '@nestjs/common';
import type { ReadinessAnswers } from '@dpdp-kit/shared';
import { orgOwned } from '../../core/org/keys';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { Prisma, ReadinessCheck } from '../../generated/prisma/client';

export interface NewReadinessCheck {
  takenByName: string;
  answers: ReadinessAnswers;
  score: number;
}

@Injectable()
export class ReadinessRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: NewReadinessCheck): Promise<ReadinessCheck> {
    return this.prisma.db.readinessCheck.create({
      data: { ...data, ...orgOwned(), answers: data.answers as unknown as Prisma.InputJsonValue },
    });
  }

  /** The newest check first. */
  findRecent(limit: number): Promise<ReadinessCheck[]> {
    return this.prisma.db.readinessCheck.findMany({
      orderBy: [{ takenAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });
  }
}

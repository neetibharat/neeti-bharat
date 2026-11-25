import { Injectable } from '@nestjs/common';
import { currentOrganizationId } from '../../core/org/org-context';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { Prisma, Training, TrainingCompletion } from '../../generated/prisma/client';

/** A training with how many of the people still at the company have taken it. */
export type TrainingRow = Training & { _count: { completions: number } };

export interface NewTraining {
  name: string;
  about?: string;
  url?: string;
  repeatsYearly?: boolean;
}

export interface TrainingChanges {
  name?: string;
  about?: string | null;
  url?: string | null;
  repeatsYearly?: boolean;
}

export interface PersonRow {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface PeoplePage {
  q?: string;
  page: number;
  limit: number;
}

const countDone = {
  _count: { select: { completions: { where: { person: { status: 'active' as const } } } } },
} as const;

const activePeople = (q?: string): Prisma.PersonWhereInput => ({
  status: 'active',
  ...(q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {}),
});

@Injectable()
export class TrainingRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Every training, those in use first, then by name. */
  findAll(): Promise<TrainingRow[]> {
    return this.prisma.db.training.findMany({
      include: countDone,
      orderBy: [{ archivedAt: { sort: 'asc', nulls: 'first' } }, { name: 'asc' }],
    });
  }

  /** The trainings in use. */
  findInUse(): Promise<Training[]> {
    return this.prisma.db.training.findMany({
      where: { archivedAt: null },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  count(): Promise<number> {
    return this.prisma.db.training.count();
  }

  findById(id: string): Promise<TrainingRow | null> {
    return this.prisma.db.training.findUnique({ where: { id }, include: countDone });
  }

  /** A training with this name, ignoring capitals, other than the one given. */
  findByName(name: string, exceptId?: string): Promise<Training | null> {
    return this.prisma.db.training.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
    });
  }

  create(data: NewTraining): Promise<TrainingRow> {
    return this.prisma.db.training.create({
      data: { ...data, organizationId: currentOrganizationId() },
      include: countDone,
    });
  }

  update(id: string, data: TrainingChanges): Promise<TrainingRow> {
    return this.prisma.db.training.update({ where: { id }, data, include: countDone });
  }

  setArchived(id: string, archivedAt: Date | null): Promise<TrainingRow> {
    return this.prisma.db.training.update({
      where: { id },
      data: { archivedAt },
      include: countDone,
    });
  }

  /** What one person has completed. */
  completionsOf(personId: string): Promise<TrainingCompletion[]> {
    return this.prisma.db.trainingCompletion.findMany({ where: { personId } });
  }

  /** What these people have completed. */
  completionsOfPeople(personIds: string[]): Promise<TrainingCompletion[]> {
    return this.prisma.db.trainingCompletion.findMany({ where: { personId: { in: personIds } } });
  }

  /** Taking a training again moves its date. */
  complete(trainingId: string, personId: string, at: Date): Promise<TrainingCompletion> {
    return this.prisma.db.trainingCompletion.upsert({
      where: { trainingId_personId: { trainingId, personId } },
      create: { trainingId, personId, completedAt: at, organizationId: currentOrganizationId() },
      update: { completedAt: at },
    });
  }

  async reopen(trainingId: string, personId: string): Promise<boolean> {
    const { count } = await this.prisma.db.trainingCompletion.deleteMany({
      where: { trainingId, personId },
    });
    return count > 0;
  }

  /** One page of the people who have not left, by name. */
  async findPeoplePage(query: PeoplePage): Promise<{ rows: PersonRow[]; total: number }> {
    const where = activePeople(query.q);
    const [rows, total] = await Promise.all([
      this.prisma.db.person.findMany({
        where,
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.db.person.count({ where }),
    ]);
    return { rows, total };
  }

  countPeople(): Promise<number> {
    return this.prisma.db.person.count({ where: activePeople() });
  }

  /** One person, whether they work here or have left. */
  findPerson(id: string): Promise<PersonRow | null> {
    return this.prisma.db.person.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, createdAt: true },
    });
  }

  /** Everyone who has not left. */
  activePeopleAll(): Promise<PersonRow[]> {
    return this.prisma.db.person.findMany({
      where: activePeople(),
      select: { id: true, name: true, email: true, createdAt: true },
    });
  }

  /** Every completion of these trainings by someone who has not left. */
  completionsOfActive(trainingIds: string[]): Promise<TrainingCompletion[]> {
    return this.prisma.db.trainingCompletion.findMany({
      where: { trainingId: { in: trainingIds }, person: { status: 'active' } },
    });
  }
}

import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  ActivityAction,
  ActivityListResponse,
  VendorListResponse,
  VendorResponse,
} from '@neeti-bharat/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import { dayToDate } from '../../frameworks/utils/dates';
import { PersonDirectory } from '../../people/services/person-directory';
import type { AddVendorInput, ListVendorsQuery, UpdateVendorInput } from '../dto/vendor.dto';
import {
  VendorRepository,
  type NewVendor,
  type RatingColumns,
  type VendorChanges,
  type VendorRow,
} from '../repositories/vendor.repository';
import { toVendorResponse } from '../utils/vendor-mapper';

type Ratings = Pick<UpdateVendorInput, 'inherent' | 'residual'>;

/** One place on the grid as its two columns. Null empties them. */
const ends = (rating: Ratings['inherent']) => ({
  likelihood: rating?.likelihood ?? null,
  impact: rating?.impact ?? null,
});

/** The two places on the risk grid as stored columns. A rating that was not sent leaves its columns alone. */
function ratingColumns({ inherent, residual }: Ratings): RatingColumns {
  const columns: RatingColumns = {};
  if (inherent !== undefined) {
    const { likelihood, impact } = ends(inherent);
    Object.assign(columns, { inherentLikelihood: likelihood, inherentImpact: impact });
  }
  if (residual !== undefined) {
    const { likelihood, impact } = ends(residual);
    Object.assign(columns, { residualLikelihood: likelihood, residualImpact: impact });
  }
  return columns;
}

/** What is stored for what was sent: the review day as a moment, and the ratings as columns. */
function stored<T extends AddVendorInput | UpdateVendorInput>(input: T) {
  const { inherent, residual, nextReviewOn, ...rest } = input;
  return {
    ...rest,
    ...(nextReviewOn === undefined ? {} : { nextReviewOn: dayToDate(nextReviewOn) }),
    ...ratingColumns({ inherent, residual }),
  };
}

/** The start of today in UTC, which stored dates are compared with. */
const startOfDay = (now: Date): Date => new Date(now.toISOString().slice(0, 10) + 'T00:00:00.000Z');

@Injectable()
export class VendorsService {
  constructor(
    private readonly vendors: VendorRepository,
    private readonly directory: PersonDirectory,
    private readonly activity: ActivityService,
  ) {}

  /** One page of vendors in a tab, plus head counts that do not change with the page or the search. */
  async list(query: ListVendorsQuery, now: Date): Promise<VendorListResponse> {
    const today = startOfDay(now);
    const [{ rows, total }, counts] = await Promise.all([
      this.vendors.findPage({ ...query, today }),
      this.vendors.counts(today),
    ]);
    return {
      vendors: rows.map((row) => toVendorResponse(row, today)),
      total,
      page: query.page,
      pageSize: query.limit,
      counts,
    };
  }

  /** One vendor, for its own page. */
  async get(id: string, now: Date): Promise<VendorResponse> {
    return toVendorResponse(await this.find(id), startOfDay(now));
  }

  /** What has been done to one vendor, newest first. */
  async activityOf(id: string, page: number, limit: number): Promise<ActivityListResponse> {
    await this.find(id);
    return this.activity.list({ page, limit, subject: { type: 'vendor', id } });
  }

  async add(input: AddVendorInput, actor: ActivityActor, now: Date): Promise<VendorResponse> {
    await this.requireFreeName(input.name);
    await this.requireOwner(input.ownerId);
    const row = await this.vendors.create(stored(input) as NewVendor);
    await this.record(actor, 'VENDOR_ADDED', row);
    return toVendorResponse(row, startOfDay(now));
  }

  async update(
    id: string,
    input: UpdateVendorInput,
    actor: ActivityActor,
    now: Date,
  ): Promise<VendorResponse> {
    const current = await this.find(id);
    if (current.archivedAt) throw new AppException('CONFLICT', HttpStatus.CONFLICT);
    if (input.name) await this.requireFreeName(input.name, id);
    await this.requireOwner(input.ownerId);
    const row = await this.vendors.update(id, stored(input) as VendorChanges);
    await this.record(actor, 'VENDOR_EDITED', row);
    return toVendorResponse(row, startOfDay(now));
  }

  /** A vendor that is no longer used keeps its row, so what it was given stays on record. */
  async archive(id: string, actor: ActivityActor, now: Date): Promise<VendorResponse> {
    const current = await this.find(id);
    if (current.archivedAt) throw new AppException('CONFLICT', HttpStatus.CONFLICT);
    const row = await this.vendors.setArchived(id, now);
    await this.record(actor, 'VENDOR_ARCHIVED', row);
    return toVendorResponse(row, startOfDay(now));
  }

  async restore(id: string, actor: ActivityActor, now: Date): Promise<VendorResponse> {
    const current = await this.find(id);
    if (!current.archivedAt) throw new AppException('CONFLICT', HttpStatus.CONFLICT);
    const row = await this.vendors.setArchived(id, null);
    await this.record(actor, 'VENDOR_RESTORED', row);
    return toVendorResponse(row, startOfDay(now));
  }

  private async find(id: string): Promise<VendorRow> {
    const row = await this.vendors.findById(id);
    if (!row) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    return row;
  }

  /** Two vendors with one name could not be told apart in a list or a log. */
  private async requireFreeName(name: string, exceptId?: string): Promise<void> {
    if (await this.vendors.findByName(name, exceptId)) {
      throw new AppException('CONFLICT', HttpStatus.CONFLICT);
    }
  }

  /** Whoever is named must still work here. */
  private async requireOwner(id: string | null | undefined): Promise<void> {
    if (id) await this.directory.requireActive(id);
  }

  private record(actor: ActivityActor, action: ActivityAction, row: VendorRow): Promise<void> {
    return this.activity.record({
      actor,
      action,
      subject: { type: 'vendor', id: row.id },
      details: { name: row.name },
    });
  }
}

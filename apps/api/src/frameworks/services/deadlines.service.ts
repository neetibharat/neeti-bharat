import { Injectable } from '@nestjs/common';
import type { DeadlinesResponse } from '@dpdp-kit/shared';
import { PersonDirectory } from '../../people/services/person-directory';
import type { ListDeadlinesQuery } from '../dto/deadlines.dto';
import { ControlRepository } from '../repositories/control.repository';
import { PolicyRepository } from '../repositories/policy.repository';
import { countTabs, deadlineItems, tabOf } from '../utils/deadlines';
import { OpenWorkReader } from './open-work-reader';

/** Everything in the company that has a date on it, so the late and the coming can be seen in one place. */
@Injectable()
export class DeadlinesService {
  constructor(
    private readonly controls: ControlRepository,
    private readonly policies: PolicyRepository,
    private readonly directory: PersonDirectory,
    private readonly openWork: OpenWorkReader,
  ) {}

  async list(query: ListDeadlinesQuery, now: Date): Promise<DeadlinesResponse> {
    const [controls, policies, open, people] = await Promise.all([
      this.controls.findActive(),
      this.policies.findActive(),
      this.openWork.read(),
      this.directory.activePeople(),
    ]);
    const all = deadlineItems({
      controls,
      policies,
      ...open,
      names: new Map(people.map((person) => [person.id, person.name])),
      now,
    });
    const onTab = all.filter((item) => tabOf(item, now) === query.tab);
    const start = (query.page - 1) * query.limit;
    return {
      items: onTab.slice(start, start + query.limit),
      total: onTab.length,
      page: query.page,
      pageSize: query.limit,
      counts: countTabs(all, now),
    };
  }
}

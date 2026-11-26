import { Injectable } from '@nestjs/common';
import type { OrganizationSummary } from '@neeti-bharat/shared';
import { ActivityService } from '../../activity/services/activity.service';
import { runInOrganization } from '../../core/org/org-context';
import { FrameworkSeedService } from '../../frameworks/services/framework-seed.service';
import { OrganizationRepository } from '../../organizations/repositories/organization.repository';
import { PeopleService } from '../../people/services/people.service';

export interface Founder {
  id: string;
  email: string;
  name: string;
}

/** Starts an organisation: its first admin, its copy of the DPDP checklist, and the first line of its activity log. */
@Injectable()
export class OrganizationSetupService {
  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly seed: FrameworkSeedService,
    private readonly people: PeopleService,
    private readonly activity: ActivityService,
  ) {}

  async create(name: string, founder: Founder): Promise<OrganizationSummary> {
    const organization = await this.organizations.createWithAdmin(name, founder.id);
    await runInOrganization(organization.id, async () => {
      await this.seed.seed();
      await this.people.ensureForAccount({ email: founder.email, name: founder.name });
      await this.activity.record({
        actor: { id: founder.id, label: founder.name || founder.email },
        action: 'ORGANIZATION_CREATED',
        subject: { type: 'organization', id: organization.id },
        details: { name },
      });
    });
    return { id: organization.id, name: organization.name, role: 'admin', onboarded: false };
  }
}

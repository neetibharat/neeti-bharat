import { HttpStatus, Injectable } from '@nestjs/common';
import type { OrganizationListResponse } from '@neeti-bharat/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import { currentOrganizationId } from '../../core/org/org-context';
import { MembershipRepository } from '../repositories/membership.repository';
import { OrganizationRepository } from '../repositories/organization.repository';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly memberships: MembershipRepository,
    private readonly organizations: OrganizationRepository,
    private readonly activity: ActivityService,
  ) {}

  /** The organisations a person can open, with their role in each. */
  async listFor(userId: string): Promise<OrganizationListResponse> {
    const open = await this.memberships.findOpen(userId);
    return {
      organizations: open.map((membership) => ({
        id: membership.organizationId,
        name: membership.organizationName,
        role: membership.role,
        onboarded: membership.onboarded,
      })),
    };
  }

  /**
   * Closes the organisation the request is for, when the name typed is its own. The activity log keeps the closing
   * and everything before it: closing hides an organisation and erases nothing.
   */
  async close(typedName: string, actor: ActivityActor): Promise<void> {
    const organizationId = currentOrganizationId();
    const name = await this.organizations.findName(organizationId);
    if (name === null || typedName.trim() !== name) {
      throw new AppException('CONFIRMATION_REQUIRED', HttpStatus.PRECONDITION_REQUIRED);
    }
    await this.activity.record({
      actor,
      action: 'ORGANIZATION_CLOSED',
      subject: { type: 'organization', id: organizationId },
      details: { name },
    });
    await this.organizations.close(organizationId, new Date());
  }

  /** Ends the set-up that follows creating an organisation, whether it was finished or skipped. */
  async completeOnboarding(actor: ActivityActor): Promise<void> {
    const organizationId = currentOrganizationId();
    if (!(await this.organizations.markOnboarded(organizationId, new Date()))) return;
    await this.activity.record({
      actor,
      action: 'ONBOARDING_COMPLETED',
      subject: { type: 'organization', id: organizationId },
    });
  }
}

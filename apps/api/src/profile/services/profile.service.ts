import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ORGANIZATION_NAME_MAX_LENGTH,
  PROFILE_FIELDS,
  isValidProfileValue,
  requiresConfirmation,
  type ProfileEntryResponse,
  type ProfileResponse,
} from '@neeti-bharat/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { currentOrganizationId } from '../../core/org/org-context';
import { OrganizationRepository } from '../../organizations/repositories/organization.repository';
import { AppException } from '../../core/common/app.exception';
import type { AddProfileEntryInput, UpdateProfileEntryInput } from '../dto/profile.dto';
import {
  builtInEntry,
  customEntry,
  customKeyFor,
  DPO_DERIVED_KEYS,
  overlayDpo,
  resolveTarget,
  type ProfileTarget,
} from '../utils/profile-entries';
import { RoleHolderReader } from '../../people/services/role-holder-reader';
import { ProfileRepository } from '../repositories/profile.repository';

@Injectable()
export class ProfileService {
  constructor(
    private readonly repository: ProfileRepository,
    private readonly activity: ActivityService,
    private readonly roleHolders: RoleHolderReader,
    private readonly organizations: OrganizationRepository,
  ) {}

  async list(): Promise<ProfileResponse> {
    const rows = await this.repository.findAll();
    const byKey = new Map(rows.map((row) => [row.key, row]));
    const entries = [
      ...PROFILE_FIELDS.map((definition) => builtInEntry(definition, byKey.get(definition.key))),
      ...rows.filter((row) => row.isCustom).map(customEntry),
    ];
    return { entries: overlayDpo(entries, await this.roleHolders.holderOf('DPO')) };
  }

  async update(
    key: string,
    input: UpdateProfileEntryInput,
    actor: ActivityActor,
  ): Promise<ProfileEntryResponse> {
    const target = resolveTarget(key, await this.repository.findByKey(key));
    if (!target) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    assertAllowed(target, input);
    await this.assertNotDerived(key);

    if (input.value !== target.current) {
      await this.repository.upsert(key, input.value);
      await this.keepOrganizationName(key, input.value);
      await this.activity.record({
        actor,
        action: 'PROFILE_UPDATED',
        subject: { type: 'profile', id: key },
        details: detailsOf(target),
        before: { value: target.current },
        after: { value: input.value },
      });
    }
    return this.entry(key);
  }

  /** The company name answer is also what the organisation is called wherever it is listed. */
  private async keepOrganizationName(key: string, value: string): Promise<void> {
    const name = value.trim();
    if (key === 'companyName' && name) {
      await this.organizations.rename(
        currentOrganizationId(),
        name.slice(0, ORGANIZATION_NAME_MAX_LENGTH),
      );
    }
  }

  async addCustom(
    input: AddProfileEntryInput,
    actor: ActivityActor,
  ): Promise<ProfileEntryResponse> {
    const key = customKeyFor(input.label);
    if (!key || !isValidProfileValue('text', input.value)) {
      throw new AppException('VALIDATION_FAILED', HttpStatus.BAD_REQUEST);
    }
    if (await this.repository.findByKey(key))
      throw new AppException('CONFLICT', HttpStatus.CONFLICT);

    const row = await this.repository.createCustom({ key, label: input.label, value: input.value });
    await this.activity.record({
      actor,
      action: 'PROFILE_ENTRY_ADDED',
      subject: { type: 'profile', id: key },
      details: { key, label: input.label },
      after: { value: input.value },
    });
    return customEntry(row);
  }

  async removeCustom(key: string, actor: ActivityActor): Promise<void> {
    const removed = await this.repository.deleteCustom(key);
    if (!removed) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    await this.activity.record({
      actor,
      action: 'PROFILE_ENTRY_REMOVED',
      subject: { type: 'profile', id: key },
      details: { key, label: removed.label ?? key },
      before: { value: removed.value },
    });
  }

  /** While someone holds the DPO role, their details are the DPO answers: change them in People and roles. */
  private async assertNotDerived(key: string): Promise<void> {
    if (DPO_DERIVED_KEYS.includes(key) && (await this.roleHolders.holderOf('DPO'))) {
      throw new AppException('CONFLICT', HttpStatus.CONFLICT);
    }
  }

  private async entry(key: string): Promise<ProfileEntryResponse> {
    const { entries } = await this.list();
    return entries.find((candidate) => candidate.key === key)!;
  }
}

/** The answer must look right, and a legal limit needs the person to confirm they mean it. */
function assertAllowed(target: ProfileTarget, input: UpdateProfileEntryInput): void {
  if (!isValidProfileValue(target.kind, input.value)) {
    throw new AppException('VALIDATION_FAILED', HttpStatus.BAD_REQUEST);
  }
  if (requiresConfirmation(target.group) && !input.confirmed) {
    throw new AppException('CONFIRMATION_REQUIRED', HttpStatus.PRECONDITION_REQUIRED);
  }
}

/** What the log sentence needs to name the answer. Built-in answers are named by the web app from their key. */
function detailsOf(target: ProfileTarget): Record<string, string> {
  return target.label ? { key: target.key, label: target.label } : { key: target.key };
}

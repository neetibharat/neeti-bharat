import { Injectable, Logger } from '@nestjs/common';
import { runInOrganization } from '../../core/org/org-context';
import { MyWorkService } from '../../frameworks/services/my-work.service';
import { NotificationRepository } from '../repositories/notification.repository';
import { PreferenceRepository } from '../repositories/preference.repository';
import { RecipientRepository, type Recipient } from '../repositories/recipient.repository';
import { choiceResolver } from '../utils/choices';
import { noticeCandidates, type NoticeCandidate } from '../utils/notice-candidates';
import { NoticeMailer } from './notice-mailer';

/** Makes the notices that people's due and late work calls for, and emails the ones they chose to be emailed. */
@Injectable()
export class NotificationScanner {
  private readonly logger = new Logger(NotificationScanner.name);

  constructor(
    private readonly recipients: RecipientRepository,
    private readonly notices: NotificationRepository,
    private readonly preferences: PreferenceRepository,
    private readonly myWork: MyWorkService,
    private readonly mailer: NoticeMailer,
  ) {}

  /** Every open organisation. One that fails is logged and does not stop the others. Safe to run again: nothing is made twice. */
  async scanAll(now: Date): Promise<void> {
    for (const organization of await this.recipients.openOrganizations()) {
      try {
        await runInOrganization(organization.id, () => this.scan(organization.name, now));
      } catch (error) {
        this.logger.error(`Notices for ${organization.id} failed`, error as Error);
      }
    }
  }

  private async scan(organization: string, now: Date): Promise<void> {
    const people = await this.recipients.recipients();
    if (people.length === 0) return;
    const [work, saved, roleDefaults] = await Promise.all([
      this.myWork.forPeople(
        people.map((p) => ({ personId: p.personId, isAdmin: p.role === 'admin' })),
      ),
      this.preferences.forUsers(people.map((p) => p.userId)),
      this.preferences.roleDefaults(),
    ]);
    for (const person of people) {
      const own = saved.filter((row) => row.userId === person.userId);
      const choose = choiceResolver(own, roleDefaults);
      const candidates = noticeCandidates(work.get(person.personId) ?? [], now);
      await this.makeFor(person, organization, candidates, choose, now);
    }
  }

  private async makeFor(
    person: Recipient,
    organization: string,
    candidates: NoticeCandidate[],
    choose: ReturnType<typeof choiceResolver>,
    now: Date,
  ): Promise<void> {
    const choiceOf = (kind: NoticeCandidate['kind']) => choose(person.role, kind);
    const wanted = candidates.filter((c) => choiceOf(c.kind).inApp || choiceOf(c.kind).email);
    if (wanted.length === 0) return;
    const have = await this.notices.existingKeys(
      person.userId,
      wanted.map((c) => c.dedupeKey),
    );
    const fresh = wanted.filter((c) => !have.has(c.dedupeKey));
    if (fresh.length === 0) return;
    // Someone who turned the inbox off still gets the email: the notice is kept, already read.
    const made = await this.notices.createMany(
      fresh.map((c) => ({
        userId: person.userId,
        ...c,
        readAt: choiceOf(c.kind).inApp ? null : now,
      })),
    );
    const sent: string[] = [];
    for (const notice of made.filter((n) => choiceOf(n.kind).email)) {
      if (await this.mailer.send(person.email, organization, notice)) sent.push(notice.id);
    }
    if (sent.length > 0) await this.notices.markEmailed(sent, now);
  }
}

import { HttpStatus, Injectable } from '@nestjs/common';
import {
  AI_FEATURES,
  AI_PROVIDERS,
  type AiFeature,
  type AiProvider,
  type AiSettingsResponse,
} from '@dpdp-kit/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import { currentOrganizationId } from '../../core/org/org-context';
import { SecretBox } from '../../core/secrets/secret-box';
import type { AiSetting } from '../../generated/prisma/client';
import type { SaveAiSettingsInput } from '../dto/ai.dto';
import { AiClient, AiProviderError, type AiTarget } from '../providers/ai-client';
import { AiSettingRepository } from '../repositories/ai-setting.repository';

const KEY_HINT_LENGTH = 4;

type Summary = Omit<AiSettingsResponse, 'enabled'>;

const NOTHING_SET: Summary = {
  provider: null,
  model: null,
  keyHint: null,
  configuredByName: null,
  disabledFeatures: [],
};

/** What is shown of the saved setting. The key is never part of it. */
function summaryOf(row: AiSetting | null): Summary {
  if (!row) return NOTHING_SET;
  return {
    provider: row.provider as AiProvider,
    model: row.model,
    keyHint: row.keyHint,
    configuredByName: row.updatedByName,
    disabledFeatures: featuresOf(row.disabledFeatures),
  };
}

/** The known features among these, once each, in the order they are listed. */
const featuresOf = (names: readonly string[] | undefined): AiFeature[] =>
  AI_FEATURES.filter((feature) => names?.includes(feature));

@Injectable()
export class AiSettingsService {
  constructor(
    private readonly settings: AiSettingRepository,
    private readonly secrets: SecretBox,
    private readonly client: AiClient,
    private readonly activity: ActivityService,
  ) {}

  async get(): Promise<AiSettingsResponse> {
    return { enabled: this.secrets.isEnabled(), ...summaryOf(await this.settings.find()) };
  }

  /** Writes one use of the AI to the activity log, with the service and model that answered, in a transaction of its own. */
  recordUse(
    use: { actor: ActivityActor; subject?: { type: string; id?: string } },
    feature: AiFeature,
    target: AiTarget,
  ): Promise<void> {
    return this.settings.inTransaction(() =>
      this.activity.record({
        actor: use.actor,
        action: 'AI_USED',
        ...(use.subject && { subject: use.subject }),
        details: { feature, provider: target.provider, model: target.model },
      }),
    );
  }

  /** Tries the key and model with the service first, then keeps the key sealed. Nothing is kept if they do not work. */
  async save(input: SaveAiSettingsInput, actor: ActivityActor): Promise<AiSettingsResponse> {
    if (!this.secrets.isEnabled()) {
      throw new AppException('SECRETS_NOT_CONFIGURED', HttpStatus.SERVICE_UNAVAILABLE);
    }
    await this.confirmWorks(input);
    await this.settings.saveWith(
      {
        provider: input.provider,
        model: input.model,
        apiKey: this.secrets.seal(input.apiKey, this.context()),
        keyHint: input.apiKey.slice(-KEY_HINT_LENGTH),
        updatedByName: actor.label,
      },
      () =>
        this.activity.record({
          actor,
          action: 'AI_CONFIGURED',
          subject: { type: 'ai' },
          details: { provider: input.provider, model: input.model },
        }),
    );
    return this.get();
  }

  async remove(actor: ActivityActor): Promise<void> {
    const row = await this.settings.find();
    if (!row) return;
    await this.settings.remove();
    await this.activity.record({
      actor,
      action: 'AI_REMOVED',
      subject: { type: 'ai' },
      details: { provider: row.provider },
    });
  }

  /** Switches features off or on for the company. Only features that exist are kept. */
  async setFeatures(disabled: AiFeature[], actor: ActivityActor): Promise<AiSettingsResponse> {
    const row = await this.settings.find();
    if (!row) throw new AppException('AI_NOT_CONFIGURED', HttpStatus.CONFLICT);
    const next = featuresOf(disabled);
    await this.settings.setDisabledFeatures(next);
    await this.activity.record({
      actor,
      action: 'AI_FEATURES_CHANGED',
      subject: { type: 'ai' },
      details: { off: next.length ? next.join(', ') : 'none' },
    });
    return this.get();
  }

  /** Refuses a feature an admin has switched off, or any feature while no AI service is set up. */
  async assertOn(feature: AiFeature): Promise<void> {
    const row = await this.settings.find();
    if (!row) throw new AppException('AI_NOT_CONFIGURED', HttpStatus.CONFLICT);
    if (featuresOf(row.disabledFeatures).includes(feature)) {
      throw new AppException('AI_FEATURE_OFF', HttpStatus.CONFLICT, { feature });
    }
  }

  /** What a call to the service needs, or AI_NOT_CONFIGURED when no one has set it up. */
  async target(): Promise<AiTarget> {
    const row = await this.settings.find();
    if (!row || !AI_PROVIDERS.includes(row.provider as AiProvider)) {
      throw new AppException('AI_NOT_CONFIGURED', HttpStatus.CONFLICT);
    }
    return {
      provider: row.provider as AiProvider,
      model: row.model,
      apiKey: this.secrets.open(row.apiKey, this.context()),
    };
  }

  /** What a sealed key is tied to, so one organisation's key cannot be opened as another's. */
  private context(): string {
    return `${currentOrganizationId()}:ai`;
  }

  private async confirmWorks(target: AiTarget): Promise<void> {
    try {
      await this.client.verify(target);
    } catch (error) {
      if (!(error instanceof AiProviderError)) throw error;
      throw new AppException('AI_FAILED', HttpStatus.BAD_REQUEST, {
        reason: error.reason,
        detail: error.detail,
      });
    }
  }
}
